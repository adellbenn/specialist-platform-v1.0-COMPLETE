import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User, UserRole } from '@modules/users/user.entity';
import { PasswordResetToken } from '../password-reset.entity';
import { RedisService } from '@common/redis/redis.service';
import { TwoFactorService } from '../two-factor/two-factor.service';
import { DeviceSessionsService } from '../device-sessions/device-sessions.service';
import { KeyRotationService } from '@common/auth/key-rotation.service';
import * as crypto from 'crypto';

jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return {
    ...actual,
    randomUUID: jest.fn(() => 'mock-uuid-1234'),
    randomBytes: jest.fn((size: number) => ({
      toString: jest.fn((enc: string) => 'mock-hex-token-' + 'a'.repeat(size)),
    })),
  };
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let resetTokenRepo: any;
  let jwtService: any;
  let configService: any;
  let redisService: any;
  let twoFactorService: any;
  let deviceSessionsService: any;
  let keyRotationService: any;

  const mockUser = () => ({
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '1234567890',
    bio: 'bio',
    role: UserRole.SPECIALIST,
    roleId: 'role-1',
    tenantId: 'tenant-1',
    avatarUrl: null,
    themePreference: 'system',
    preferences: {},
    passwordHash: '$2b$12$hashedpassword',
    isActive: true,
    mustChangePassword: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorBackupCodes: null,
    tenant: { id: 'tenant-1', name: 'Test Tenant' },
    validatePassword: jest.fn(),
    lastLoginAt: null,
  });

  const mockRefreshPayload = {
    sub: 'user-1',
    email: 'test@example.com',
    role: UserRole.SPECIALIST,
    tenantId: 'tenant-1',
    jti: 'jti-123',
  };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    };

    resetTokenRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string, defaultVal?: string) => {
        const config: Record<string, string> = {
          'jwt.secret': 'test-secret',
          'jwt.refreshSecret': 'test-refresh-secret',
          'jwt.expiresIn': '1h',
          'jwt.refreshExpiresIn': '7d',
          'app.frontendUrl': 'http://localhost:3000',
          'app.nodeEnv': 'development',
        };
        return config[key] ?? defaultVal;
      }),
    };

    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delPattern: jest.fn(),
      getJson: jest.fn(),
      setJson: jest.fn(),
      isAvailable: jest.fn().mockReturnValue(true),
    };

    twoFactorService = {
      createTempToken: jest.fn().mockResolvedValue('temp-token-abc'),
      verifyTempToken: jest.fn(),
      verifyLogin: jest.fn(),
    };

    deviceSessionsService = {
      createSession: jest.fn(),
      getActiveSessions: jest.fn(),
      revokeSession: jest.fn(),
      revokeAllSessions: jest.fn(),
      revokeByRefreshTokenJti: jest.fn(),
      generateDeviceId: jest.fn().mockReturnValue('device-hash-16'),
      updateLastActive: jest.fn(),
    };

    keyRotationService = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
      getSecretForKey: jest.fn().mockReturnValue('test-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(PasswordResetToken), useValue: resetTokenRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: RedisService, useValue: redisService },
        { provide: TwoFactorService, useValue: twoFactorService },
        { provide: DeviceSessionsService, useValue: deviceSessionsService },
        { provide: KeyRotationService, useValue: keyRotationService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.spyOn(User, 'hashPassword').mockResolvedValue('$2b$12$newhash');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'no@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if account is locked', async () => {
      const user = mockUser();
      (user as any).lockedUntil = new Date(Date.now() + 600000);
      userRepo.findOne.mockResolvedValue(user);

      await expect(
        service.login({ email: user.email, password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw and increment failed attempts on wrong password', async () => {
      const user = mockUser();
      user.validatePassword.mockResolvedValue(false);
      user.failedLoginAttempts = 2;
      userRepo.findOne.mockResolvedValue(user);

      await expect(
        service.login({ email: user.email, password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(userRepo.update).toHaveBeenCalledWith(user.id, {
        failedLoginAttempts: 3,
      });
    });

    it('should lock account after 5 failed attempts', async () => {
      const user = mockUser();
      user.validatePassword.mockResolvedValue(false);
      user.failedLoginAttempts = 4;
      userRepo.findOne.mockResolvedValue(user);

      await expect(
        service.login({ email: user.email, password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(userRepo.update).toHaveBeenCalledWith(user.id, {
        failedLoginAttempts: 5,
        lockedUntil: expect.any(Date),
      });
    });

    it('should reset failed attempts on successful login', async () => {
      const user = mockUser();
      user.validatePassword.mockResolvedValue(true);
      user.failedLoginAttempts = 3;
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      const result = await service.login({ email: user.email, password: 'correct' });

      expect(userRepo.save).toHaveBeenCalled();
      expect(result.accessToken).toBeDefined();
    });

    it('should return tokens on successful login without 2FA', async () => {
      const user = mockUser();
      user.validatePassword.mockResolvedValue(true);
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      const result = await service.login({ email: user.email, password: 'correct' });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-jwt-token');
      expect(result.requiresTwoFactor).toBeUndefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should create device session if userAgent and ip provided', async () => {
      const user = mockUser();
      user.validatePassword.mockResolvedValue(true);
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      await service.login({ email: user.email, password: 'correct' }, 'Mozilla/5.0', '127.0.0.1');

      expect(deviceSessionsService.createSession).toHaveBeenCalledWith(
        user.id,
        'Mozilla/5.0',
        '127.0.0.1',
        expect.any(String),
      );
    });

    it('should not create device session without userAgent/ip', async () => {
      const user = mockUser();
      user.validatePassword.mockResolvedValue(true);
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      await service.login({ email: user.email, password: 'correct' });

      expect(deviceSessionsService.createSession).not.toHaveBeenCalled();
    });

    it('should return tempToken when 2FA is enabled', async () => {
      const user = mockUser();
      user.twoFactorEnabled = true;
      user.validatePassword.mockResolvedValue(true);
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      const result = await service.login({ email: user.email, password: 'correct' });

      expect(result.requiresTwoFactor).toBe(true);
      expect(result.tempToken).toBe('temp-token-abc');
      expect(result.accessToken).toBe('');
      expect(result.refreshToken).toBe('');
      expect(twoFactorService.createTempToken).toHaveBeenCalledWith(user);
    });

    it('should return mustChangePassword when true', async () => {
      const user = mockUser();
      user.mustChangePassword = true;
      user.validatePassword.mockResolvedValue(true);
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      const result = await service.login({ email: user.email, password: 'correct' });

      expect(result.mustChangePassword).toBe(true);
    });

    it('should update lastLoginAt on successful login', async () => {
      const user = mockUser();
      user.validatePassword.mockResolvedValue(true);
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      await service.login({ email: user.email, password: 'correct' });

      expect(userRepo.update).toHaveBeenCalledWith(user.id, {
        lastLoginAt: expect.any(Date),
      });
    });
  });

  describe('completeTwoFactorLogin', () => {
    it('should throw if tempToken verification fails', async () => {
      twoFactorService.verifyTempToken.mockRejectedValue(new Error('Invalid token'));

      await expect(
        service.completeTwoFactorLogin('bad-token', '123456'),
      ).rejects.toThrow();
    });

    it('should throw if user not found', async () => {
      twoFactorService.verifyTempToken.mockResolvedValue({ sub: 'user-1', email: 'a@b.com' });
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.completeTwoFactorLogin('token', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if 2FA code is invalid', async () => {
      twoFactorService.verifyTempToken.mockResolvedValue({ sub: 'user-1', email: 'a@b.com' });
      userRepo.findOne.mockResolvedValue(mockUser());
      twoFactorService.verifyLogin.mockResolvedValue(false);

      await expect(
        service.completeTwoFactorLogin('token', 'bad-code'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on valid 2FA completion', async () => {
      const user = mockUser();
      twoFactorService.verifyTempToken.mockResolvedValue({ sub: 'user-1', email: 'a@b.com' });
      userRepo.findOne.mockResolvedValue(user);
      twoFactorService.verifyLogin.mockResolvedValue(true);

      const result = await service.completeTwoFactorLogin('token', '123456');

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-jwt-token');
    });

    it('should create device session with userAgent and ip', async () => {
      const user = mockUser();
      twoFactorService.verifyTempToken.mockResolvedValue({ sub: 'user-1', email: 'a@b.com' });
      userRepo.findOne.mockResolvedValue(user);
      twoFactorService.verifyLogin.mockResolvedValue(true);

      await service.completeTwoFactorLogin('token', '123456', 'Mozilla/5.0', '127.0.0.1');

      expect(deviceSessionsService.createSession).toHaveBeenCalledWith(
        user.id,
        'Mozilla/5.0',
        '127.0.0.1',
        expect.any(String),
      );
    });
  });

  describe('refreshToken', () => {
    it('should throw if JWT verification fails', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(
        service.refreshToken({ refreshToken: 'bad-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if user not found', async () => {
      jwtService.verify.mockReturnValue(mockRefreshPayload);
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.refreshToken({ refreshToken: 'token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw on token reuse detection', async () => {
      jwtService.verify.mockReturnValue(mockRefreshPayload);
      userRepo.findOne.mockResolvedValue(mockUser());
      redisService.get.mockResolvedValue(null);

      await expect(
        service.refreshToken({ refreshToken: 'token' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(deviceSessionsService.revokeAllSessions).toHaveBeenCalledWith('user-1');
    });

    it('should issue new tokens on valid refresh', async () => {
      const user = mockUser();
      jwtService.verify.mockReturnValue(mockRefreshPayload);
      userRepo.findOne.mockResolvedValue(user);
      redisService.get.mockResolvedValue('old-token');

      const result = await service.refreshToken({ refreshToken: 'token' });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-jwt-token');
      expect(redisService.del).toHaveBeenCalledWith('refresh:user-1:jti-123');
    });

    it('should update device session with userAgent and ip', async () => {
      const user = mockUser();
      jwtService.verify.mockReturnValue(mockRefreshPayload);
      userRepo.findOne.mockResolvedValue(user);
      redisService.get.mockResolvedValue('old-token');

      await service.refreshToken({ refreshToken: 'token' }, 'Mozilla/5.0', '127.0.0.1');

      expect(deviceSessionsService.generateDeviceId).toHaveBeenCalledWith('Mozilla/5.0', '127.0.0.1');
      expect(deviceSessionsService.updateLastActive).toHaveBeenCalledWith(
        'user-1',
        'device-hash-16',
        'mock-uuid-1234',
      );
    });

    it('should NOT treat Redis outage as token reuse', async () => {
      jwtService.verify.mockReturnValue(mockRefreshPayload);
      userRepo.findOne.mockResolvedValue(mockUser());
      redisService.isAvailable.mockReturnValue(false);

      await expect(
        service.refreshToken({ refreshToken: 'token' }),
      ).rejects.toThrow(ServiceUnavailableException);

      expect(redisService.get).not.toHaveBeenCalled();
      expect(redisService.delPattern).not.toHaveBeenCalledWith('refresh:user-1:*');
      expect(deviceSessionsService.revokeAllSessions).not.toHaveBeenCalled();
    });

    it('should skip Redis validation if no jti', async () => {
      const payload = { ...mockRefreshPayload, jti: undefined };
      jwtService.verify.mockReturnValue(payload);
      userRepo.findOne.mockResolvedValue(mockUser());

      const result = await service.refreshToken({ refreshToken: 'token' });

      expect(redisService.get).not.toHaveBeenCalled();
      expect(result.accessToken).toBe('mock-jwt-token');
    });
  });

  describe('logout', () => {
    it('should revoke refresh token and session', async () => {
      jwtService.verify.mockReturnValue(mockRefreshPayload);

      await service.logout('user-1', 'refresh-token', 'Mozilla/5.0', '127.0.0.1');

      expect(redisService.del).toHaveBeenCalledWith('refresh:user-1:jti-123');
      expect(deviceSessionsService.revokeByRefreshTokenJti).toHaveBeenCalledWith('user-1', 'jti-123');
    });

    it('should handle expired token gracefully', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('expired');
      });

      await expect(
        service.logout('user-1', 'expired-token'),
      ).resolves.toBeUndefined();
    });

    it('should handle missing refreshToken', async () => {
      await expect(service.logout('user-1')).resolves.toBeUndefined();

      expect(jwtService.verify).not.toHaveBeenCalled();
    });
  });

  describe('logoutAll', () => {
    it('should revoke all tokens and sessions', async () => {
      await service.logoutAll('user-1');

      expect(redisService.delPattern).toHaveBeenCalledWith('refresh:user-1:*');
      expect(deviceSessionsService.revokeAllSessions).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getActiveSessions', () => {
    it('should delegate to deviceSessionsService', async () => {
      deviceSessionsService.getActiveSessions.mockResolvedValue([]);

      const result = await service.getActiveSessions('user-1');

      expect(result).toEqual([]);
      expect(deviceSessionsService.getActiveSessions).toHaveBeenCalledWith('user-1');
    });
  });

  describe('revokeSession', () => {
    it('should revoke session and get active sessions', async () => {
      deviceSessionsService.getActiveSessions.mockResolvedValue([]);

      await service.revokeSession('user-1', 'device-1');

      expect(deviceSessionsService.revokeSession).toHaveBeenCalledWith('user-1', 'device-1');
    });

    it('should also delete the refresh token bound to the device session', async () => {
      deviceSessionsService.getActiveSessions.mockResolvedValue([
        {
          deviceId: 'device-1',
          userAgent: 'UA',
          ip: 'IP',
          lastActive: '2024-01-01T00:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          refreshTokenJti: 'jti-xyz',
        },
      ]);

      await service.revokeSession('user-1', 'device-1');

      expect(deviceSessionsService.revokeSession).toHaveBeenCalledWith('user-1', 'device-1');
      expect(redisService.del).toHaveBeenCalledWith('refresh:user-1:jti-xyz');
    });

    it('should skip refresh token deletion when session has no jti', async () => {
      deviceSessionsService.getActiveSessions.mockResolvedValue([]);

      await service.revokeSession('user-1', 'device-1');

      expect(redisService.del).not.toHaveBeenCalledWith(
        expect.stringMatching(/^refresh:user-1:/),
      );
    });
  });

  describe('updateTheme', () => {
    it('should update theme and invalidate cache', async () => {
      await service.updateTheme('user-1', 'dark');

      expect(userRepo.update).toHaveBeenCalledWith('user-1', { themePreference: 'dark' });
      expect(redisService.del).toHaveBeenCalledWith('user:user-1');
    });
  });

  describe('updateProfile', () => {
    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile('user-1', { firstName: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update profile fields', async () => {
      const user = mockUser();
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      const result = await service.updateProfile('user-1', {
        firstName: 'New',
        lastName: 'Name',
        phone: '999',
        bio: 'new bio',
      });

      expect(user.firstName).toBe('New');
      expect(user.lastName).toBe('Name');
      expect(user.phone).toBe('999');
      expect(user.bio).toBe('new bio');
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should only update provided fields', async () => {
      const user = mockUser();
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      await service.updateProfile('user-1', { firstName: 'New' });

      expect(user.firstName).toBe('New');
      expect(user.lastName).toBe('User');
    });
  });

  describe('changePassword', () => {
    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.changePassword('user-1', { currentPassword: 'old', newPassword: 'new' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if current password invalid', async () => {
      const user = mockUser();
      user.validatePassword.mockResolvedValue(false);
      userRepo.findOne.mockResolvedValue(user);

      await expect(
        service.changePassword('user-1', { currentPassword: 'wrong', newPassword: 'new' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should hash new password and save', async () => {
      const user = mockUser();
      user.validatePassword.mockResolvedValue(true);
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      await service.changePassword('user-1', { currentPassword: 'correct', newPassword: 'new' });

      expect(User.hashPassword).toHaveBeenCalledWith('new');
      expect(user.passwordHash).toBe('$2b$12$newhash');
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should clear mustChangePassword if true', async () => {
      const user = mockUser();
      user.mustChangePassword = true;
      user.validatePassword.mockResolvedValue(true);
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      await service.changePassword('user-1', { currentPassword: 'correct', newPassword: 'new' });

      expect(user.mustChangePassword).toBe(false);
    });
  });

  describe('getProfile', () => {
    it('should throw BadRequestException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getProfile('user-1')).rejects.toThrow(BadRequestException);
    });

    it('should return sanitized user profile', async () => {
      const user = mockUser();
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.getProfile('user-1');

      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('Test');
      expect(result.tenant).toEqual({ id: 'tenant-1', name: 'Test Tenant' });
    });
  });

  describe('forgotPassword', () => {
    it('should return message even if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'no@example.com' });

      expect(result.message).toContain('إذا كان البريد موجوداً');
    });

    it('should create reset token and return link', async () => {
      const user = mockUser();
      userRepo.findOne.mockResolvedValue(user);
      resetTokenRepo.update.mockResolvedValue(undefined);
      resetTokenRepo.save.mockResolvedValue(undefined);

      const result = await service.forgotPassword({ email: user.email });

      expect(resetTokenRepo.update).toHaveBeenCalledWith(
        { userId: user.id, isUsed: false },
        { isUsed: true },
      );
      expect(resetTokenRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          userId: user.id,
          isUsed: false,
        }),
      );
      expect(result.resetLink).toContain('/auth/reset-password?token=');
    });

    it('should not include resetLink in production', async () => {
      const originalGet = configService.get;
      configService.get.mockImplementation((key: string, defaultVal?: string) => {
        if (key === 'app.nodeEnv') return 'production';
        const config: Record<string, string> = {
          'jwt.secret': 'test-secret',
          'jwt.refreshSecret': 'test-refresh-secret',
          'jwt.expiresIn': '1h',
          'jwt.refreshExpiresIn': '7d',
          'app.frontendUrl': 'http://localhost:3000',
        };
        return config[key] ?? defaultVal;
      });

      const user = mockUser();
      userRepo.findOne.mockResolvedValue(user);
      resetTokenRepo.update.mockResolvedValue(undefined);
      resetTokenRepo.save.mockResolvedValue(undefined);

      const result = await service.forgotPassword({ email: user.email });

      expect(result.resetLink).toBeUndefined();
    });
  });

  describe('resetPassword', () => {
    it('should throw if reset token not found', async () => {
      resetTokenRepo.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'bad', password: 'new' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if token expired', async () => {
      const expiredToken = {
        token: 'tok',
        isUsed: false,
        expiresAt: new Date(Date.now() - 1000),
        user: mockUser(),
      };
      resetTokenRepo.findOne.mockResolvedValue(expiredToken);

      await expect(
        service.resetPassword({ token: 'tok', password: 'new' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should hash password and mark token used', async () => {
      const user = mockUser();
      const resetToken: any = {
        token: 'tok',
        isUsed: false,
        expiresAt: new Date(Date.now() + 3600000),
        user,
        usedAt: null,
      };
      resetTokenRepo.findOne.mockResolvedValue(resetToken);
      userRepo.save.mockResolvedValue(user);
      resetTokenRepo.save.mockResolvedValue(resetToken);

      const result = await service.resetPassword({ token: 'tok', password: 'new' });

      expect(User.hashPassword).toHaveBeenCalledWith('new');
      expect(user.passwordHash).toBe('$2b$12$newhash');
      expect(resetToken.isUsed).toBe(true);
      expect(resetToken.usedAt).toBeDefined();
      expect(result.message).toContain('تم إعادة تعيين');
    });
  });

  describe('parseExpirationToSeconds (private)', () => {
    const setupRefreshContext = (ttl: string) => {
      configService.get.mockImplementation((key: string, defaultVal?: string) => {
        const cfg: Record<string, string> = {
          'jwt.secret': 'test-secret',
          'jwt.refreshSecret': 'test-refresh-secret',
          'jwt.expiresIn': '1h',
          'jwt.refreshExpiresIn': ttl,
          'app.frontendUrl': 'http://localhost:3000',
          'app.nodeEnv': 'development',
        };
        return cfg[key] ?? defaultVal;
      });
      jwtService.verify.mockReturnValue(mockRefreshPayload);
      const user = mockUser();
      userRepo.findOne.mockResolvedValue(user);
      redisService.get.mockResolvedValue('old-token');
    };

    it('should parse seconds', async () => {
      setupRefreshContext('30s');

      await service.refreshToken({ refreshToken: 'token' });

      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('refresh:'),
        expect.any(String),
        30,
      );
    });

    it('should parse minutes', async () => {
      setupRefreshContext('5m');

      await service.refreshToken({ refreshToken: 'token' });

      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('refresh:'),
        expect.any(String),
        300,
      );
    });

    it('should parse hours', async () => {
      setupRefreshContext('1h');

      await service.refreshToken({ refreshToken: 'token' });

      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('refresh:'),
        expect.any(String),
        3600,
      );
    });

    it('should parse days', async () => {
      setupRefreshContext('7d');

      await service.refreshToken({ refreshToken: 'token' });

      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('refresh:'),
        expect.any(String),
        604800,
      );
    });

    it('should fallback to 7 days for invalid format', async () => {
      setupRefreshContext('invalid');

      await service.refreshToken({ refreshToken: 'token' });

      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('refresh:'),
        expect.any(String),
        604800,
      );
    });
  });

  describe('sanitizeUser (private)', () => {
    it('should return sanitized user without sensitive fields', async () => {
      const user = mockUser();
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.getProfile('user-1');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('twoFactorSecret');
      expect(result).not.toHaveProperty('twoFactorBackupCodes');
      expect(result).not.toHaveProperty('failedLoginAttempts');
      expect(result).not.toHaveProperty('lockedUntil');
      expect(result.tenant).toEqual({ id: 'tenant-1', name: 'Test Tenant' });
    });

    it('should handle missing tenant', async () => {
      const user = mockUser();
      user.tenant = null as any;
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.getProfile('user-1');

      expect(result.tenant).toBeNull();
    });
  });
});
