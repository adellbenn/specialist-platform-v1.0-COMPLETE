import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { TwoFactorService } from '../two-factor.service';
import { User } from '@modules/users/user.entity';
import { RedisService } from '@common/redis/redis.service';
import * as speakeasy from 'speakeasy';

jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(),
  totp: {
    verify: jest.fn(),
  },
}));

describe('TwoFactorService', () => {
  let service: TwoFactorService;
  let userRepo: any;
  let jwtService: any;
  let configService: any;
  let redisService: any;

  const mockUser = (overrides: any = {}): any => ({
    id: 'user-1',
    email: 'test@example.com',
    twoFactorEnabled: false,
    twoFactorSecret: undefined,
    twoFactorBackupCodes: undefined,
    passwordHash: '$2b$12$hashed',
    validatePassword: jest.fn(),
    ...overrides,
  });

  beforeEach(async () => {
    userRepo = {
      findOneBy: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-temp-token'),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue('test'),
    };

    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      getJson: jest.fn(),
      setJson: jest.fn(),
    };

    (speakeasy.generateSecret as jest.Mock).mockReturnValue({
      base32: 'JBSWY3DPEHPK3PXP',
      otpauth_url: 'otpauth://totp/test',
    });

    (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<TwoFactorService>(TwoFactorService);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('generateSecret', () => {
    it('should throw BadRequestException if user not found', async () => {
      userRepo.findOneBy.mockResolvedValue(null);

      await expect(service.generateSecret('user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if 2FA already enabled', async () => {
      userRepo.findOneBy.mockResolvedValue(mockUser({ twoFactorEnabled: true }));

      await expect(service.generateSecret('user-1')).rejects.toThrow(BadRequestException);
    });

    it('should generate secret, backup codes, and store in Redis', async () => {
      const user = mockUser();
      userRepo.findOneBy.mockResolvedValue(user);

      const result = await service.generateSecret('user-1');

      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: 'SpecialistPlatform (test@example.com)',
        issuer: 'SpecialistPlatform',
      });
      expect(result.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(result.otpauthUrl).toBe('otpauth://totp/test');
      expect(result.backupCodes).toHaveLength(10);
      expect(redisService.setJson).toHaveBeenCalledWith(
        '2fa:temp:setup:user-1',
        { secret: 'JBSWY3DPEHPK3PXP', backupCodes: result.backupCodes },
        600,
      );
    });
  });

  describe('verifyAndEnable', () => {
    it('should throw if setup session expired', async () => {
      redisService.getJson.mockResolvedValue(null);

      await expect(service.verifyAndEnable('user-1', '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if code is invalid', async () => {
      redisService.getJson.mockResolvedValue({ secret: 'SEC', backupCodes: [] });
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      await expect(service.verifyAndEnable('user-1', 'bad')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should enable 2FA on valid code', async () => {
      redisService.getJson.mockResolvedValue({ secret: 'SEC', backupCodes: ['CODE1', 'CODE2'] });

      await service.verifyAndEnable('user-1', '123456');

      expect(userRepo.update).toHaveBeenCalledWith('user-1', {
        twoFactorSecret: 'SEC',
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(['CODE1', 'CODE2']),
      });
      expect(redisService.del).toHaveBeenCalledWith('2fa:temp:setup:user-1');
    });
  });

  describe('disable', () => {
    it('should throw if user not found', async () => {
      userRepo.findOneBy.mockResolvedValue(null);

      await expect(service.disable('user-1', 'pass', '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if 2FA not enabled', async () => {
      userRepo.findOneBy.mockResolvedValue(mockUser({ twoFactorEnabled: false }));

      await expect(service.disable('user-1', 'pass', '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if password invalid', async () => {
      const user = mockUser({ twoFactorEnabled: true });
      user.validatePassword.mockResolvedValue(false);
      userRepo.findOneBy.mockResolvedValue(user);

      await expect(service.disable('user-1', 'wrong', '123456')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if TOTP code invalid', async () => {
      const user = mockUser({
        twoFactorEnabled: true,
        twoFactorSecret: 'SECRET',
      });
      user.validatePassword.mockResolvedValue(true);
      userRepo.findOneBy.mockResolvedValue(user);
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      await expect(service.disable('user-1', 'pass', 'bad')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should disable 2FA on valid password and code', async () => {
      const user = mockUser({
        twoFactorEnabled: true,
        twoFactorSecret: 'SECRET',
      });
      user.validatePassword.mockResolvedValue(true);
      userRepo.findOneBy.mockResolvedValue(user);

      await service.disable('user-1', 'pass', '123456');

      expect(userRepo.update).toHaveBeenCalledWith('user-1', {
        twoFactorSecret: null,
        twoFactorEnabled: false,
        twoFactorBackupCodes: null,
      });
    });
  });

  describe('verifyLogin', () => {
    it('should return true for valid TOTP code', async () => {
      const user = mockUser({
        twoFactorEnabled: true,
        twoFactorSecret: 'SECRET',
      });

      const result = await service.verifyLogin(user, '123456');

      expect(result).toBe(true);
      expect(speakeasy.totp.verify).toHaveBeenCalled();
    });

    it('should try backup codes if TOTP fails', async () => {
      const user = mockUser({
        twoFactorSecret: 'SECRET',
        twoFactorBackupCodes: JSON.stringify(['CODE1', 'CODE2']),
      });
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      const result = await service.verifyLogin(user, 'CODE1');

      expect(result).toBe(true);
      expect(userRepo.update).toHaveBeenCalledWith('user-1', {
        twoFactorBackupCodes: JSON.stringify(['CODE2']),
      });
    });

    it('should return false if both TOTP and backup codes fail', async () => {
      const user = mockUser({
        twoFactorSecret: 'SECRET',
        twoFactorBackupCodes: JSON.stringify(['CODE1']),
      });
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      const result = await service.verifyLogin(user, 'WRONG');

      expect(result).toBe(false);
    });

    it('should return false if no backup codes and TOTP fails', async () => {
      const user = mockUser({
        twoFactorSecret: 'SECRET',
        twoFactorBackupCodes: undefined,
      });
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      const result = await service.verifyLogin(user, 'WRONG');

      expect(result).toBe(false);
    });

    it('should handle backup code case-insensitively', async () => {
      const user = mockUser({
        twoFactorSecret: undefined,
        twoFactorBackupCodes: JSON.stringify(['CODE1']),
      });

      const result = await service.verifyLogin(user, 'code1');

      expect(result).toBe(true);
    });
  });

  describe('createTempToken', () => {
    it('should sign and store temp token', async () => {
      const user = mockUser();

      const result = await service.createTempToken(user);

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-1', email: 'test@example.com', type: '2fa_pending' },
        { expiresIn: '5m' },
      );
      expect(redisService.set).toHaveBeenCalledWith(
        '2fa:temp:user-1',
        'signed-temp-token',
        300,
      );
      expect(result).toBe('signed-temp-token');
    });
  });

  describe('verifyTempToken', () => {
    it('should throw if JWT verification fails', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.verifyTempToken('bad')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if token type is wrong', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', email: 'a@b.com', type: 'wrong' });

      await expect(service.verifyTempToken('token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if token not found in Redis', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', email: 'a@b.com', type: '2fa_pending' });
      redisService.get.mockResolvedValue(null);

      await expect(service.verifyTempToken('token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if stored token does not match', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', email: 'a@b.com', type: '2fa_pending' });
      redisService.get.mockResolvedValue('different-token');

      await expect(service.verifyTempToken('token')).rejects.toThrow(UnauthorizedException);
    });

    it('should return payload and delete token on success', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', email: 'a@b.com', type: '2fa_pending' });
      redisService.get.mockResolvedValue('token');

      const result = await service.verifyTempToken('token');

      expect(result).toEqual({ sub: 'user-1', email: 'a@b.com' });
      expect(redisService.del).toHaveBeenCalledWith('2fa:temp:user-1');
    });
  });

  describe('getStatus', () => {
    it('should throw if user not found', async () => {
      userRepo.findOneBy.mockResolvedValue(null);

      await expect(service.getStatus('user-1')).rejects.toThrow(BadRequestException);
    });

    it('should return enabled state and backup codes count', async () => {
      userRepo.findOneBy.mockResolvedValue(
        mockUser({
          twoFactorEnabled: true,
          twoFactorBackupCodes: JSON.stringify(['A', 'B', 'C']),
        }),
      );

      const result = await service.getStatus('user-1');

      expect(result).toEqual({ enabled: true, backupCodesRemaining: 3 });
    });

    it('should return 0 backup codes when null', async () => {
      userRepo.findOneBy.mockResolvedValue(mockUser({ twoFactorBackupCodes: undefined }));

      const result = await service.getStatus('user-1');

      expect(result).toEqual({ enabled: false, backupCodesRemaining: 0 });
    });
  });
});
