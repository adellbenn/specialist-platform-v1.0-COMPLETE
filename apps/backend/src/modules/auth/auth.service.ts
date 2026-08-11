import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '@modules/users/user.entity';
import { PasswordResetToken } from './password-reset.entity';
import {
  LoginDto,
  AuthResponseDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { RedisService } from '@common/redis/redis.service';
import { TwoFactorService } from './two-factor/two-factor.service';
import { DeviceSessionsService } from './device-sessions/device-sessions.service';
import { KeyRotationService } from '@common/auth/key-rotation.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly REFRESH_TOKEN_PREFIX = 'refresh:';
  private static readonly REFRESH_TOKEN_TTL_KEY = 'jwt.refreshExpiresIn';

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private resetTokenRepository: Repository<PasswordResetToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private twoFactorService: TwoFactorService,
    private deviceSessionsService: DeviceSessionsService,
    private keyRotationService: KeyRotationService,
  ) {}

  async login(
    loginDto: LoginDto,
    userAgent?: string,
    ip?: string,
  ): Promise<AuthResponseDto & { requiresTwoFactor?: boolean; tempToken?: string }> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email, isActive: true },
      relations: ['tenant'],
    });

    if (!user) {
      this.logger.warn(`Login attempt for non-existent email: ${loginDto.email}`);
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingSeconds = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      this.logger.warn(`Login attempt on locked account: ${user.email}`);
      throw new UnauthorizedException(
        `الحساب مقفل مؤقتاً. حاول مرة أخرى بعد ${Math.ceil(remainingSeconds / 60)} دقيقة`,
      );
    }

    const isPasswordValid = await user.validatePassword(loginDto.password);
    if (!isPasswordValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updateData: any = { failedLoginAttempts: attempts };

      if (attempts >= AuthService.MAX_FAILED_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + AuthService.LOCKOUT_DURATION_MS);
        this.logger.warn(`Account locked after ${attempts} failed attempts: ${user.email}`);
      }

      await this.userRepository.update(user.id, updateData);
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    // Successful login — reset failed attempts and clear lock
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = null as any;
      await this.userRepository.save(user);
    }

    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    // 2FA check — if enabled, return temp token instead of full tokens
    if (user.twoFactorEnabled) {
      const tempToken = await this.twoFactorService.createTempToken(user);
      this.logger.log(`2FA required for user ${user.id}`);
      return {
        accessToken: '',
        refreshToken: '',
        mustChangePassword: false,
        user: this.sanitizeUser(user),
        requiresTwoFactor: true,
        tempToken,
      };
    }

    // No 2FA — issue full tokens
    const tokens = await this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshTokenJti, tokens.refreshToken);

    // Create device session
    if (userAgent && ip) {
      await this.deviceSessionsService.createSession(
        user.id,
        userAgent,
        ip,
        tokens.refreshTokenJti,
      );
    }

    return {
      ...tokens,
      mustChangePassword: user.mustChangePassword || false,
      user: this.sanitizeUser(user),
    };
  }

  async completeTwoFactorLogin(
    tempToken: string,
    code: string,
    userAgent?: string,
    ip?: string,
  ): Promise<AuthResponseDto> {
    const payload = await this.twoFactorService.verifyTempToken(tempToken);

    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true },
      relations: ['tenant'],
    });

    if (!user) throw new UnauthorizedException('المستخدم غير موجود');

    const isValid = await this.twoFactorService.verifyLogin(user, code);
    if (!isValid) throw new UnauthorizedException('رمز التحقق غير صحيح');

    const tokens = await this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshTokenJti, tokens.refreshToken);

    // Create device session
    if (userAgent && ip) {
      await this.deviceSessionsService.createSession(
        user.id,
        userAgent,
        ip,
        tokens.refreshTokenJti,
      );
    }

    return {
      ...tokens,
      mustChangePassword: user.mustChangePassword || false,
      user: this.sanitizeUser(user),
    };
  }

  async refreshToken(
    dto: RefreshTokenDto,
    userAgent?: string,
    ip?: string,
  ): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub, isActive: true },
        relations: ['tenant'],
      });

      if (!user) {
        throw new UnauthorizedException('رمز التحديث غير صالح');
      }

      // Validate against Redis if jti exists and Redis is available
      if (payload.jti) {
        const stored = await this.redisService.get(
          `${AuthService.REFRESH_TOKEN_PREFIX}${payload.sub}:${payload.jti}`,
        );

        if (!stored) {
          this.logger.warn(`Refresh token reuse detected for user ${payload.sub}`);
          // Token was already used or revoked — revoke ALL tokens and sessions
          await this.revokeAllUserTokens(payload.sub);
          await this.deviceSessionsService.revokeAllSessions(payload.sub);
          throw new UnauthorizedException(
            'تم استخدام رمز التحديث مسبقاً — تم تسجيل الخروج من جميع الأجهزة',
          );
        }

        // Delete old token (one-time use)
        await this.redisService.del(
          `${AuthService.REFRESH_TOKEN_PREFIX}${payload.sub}:${payload.jti}`,
        );
      }

      // Issue new tokens
      const tokens = await this.generateTokens(user);
      await this.storeRefreshToken(user.id, tokens.refreshTokenJti, tokens.refreshToken);

      // Update device session
      if (userAgent && ip) {
        const deviceId = this.deviceSessionsService.generateDeviceId(userAgent, ip);
        await this.deviceSessionsService.updateLastActive(user.id, deviceId);
      }

      return { ...tokens, user: this.sanitizeUser(user) };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('رمز التحديث منتهي الصلاحية أو غير صالح');
    }
  }

  async logout(
    userId: string,
    refreshToken?: string,
    userAgent?: string,
    ip?: string,
  ): Promise<void> {
    if (refreshToken) {
      try {
        const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
          secret: this.configService.get<string>('jwt.refreshSecret'),
        });
        if (payload.jti) {
          await this.redisService.del(
            `${AuthService.REFRESH_TOKEN_PREFIX}${userId}:${payload.jti}`,
          );
          // Revoke device session
          await this.deviceSessionsService.revokeByRefreshTokenJti(userId, payload.jti);
        }
      } catch {
        // Token already expired — nothing to revoke
      }
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.revokeAllUserTokens(userId);
    await this.deviceSessionsService.revokeAllSessions(userId);
  }

  async getActiveSessions(userId: string) {
    return this.deviceSessionsService.getActiveSessions(userId);
  }

  async revokeSession(userId: string, deviceId: string) {
    await this.deviceSessionsService.revokeSession(userId, deviceId);
    // Also revoke the refresh token associated with this session
    const sessions = await this.deviceSessionsService.getActiveSessions(userId);
    // Session already removed from Redis by revokeSession
  }

  async updateTheme(userId: string, theme: string): Promise<void> {
    await this.userRepository.update(userId, { themePreference: theme } as any);
    await this.invalidateUserCache(userId);
  }

  async updateProfile(
    userId: string,
    dto: { firstName?: string; lastName?: string; phone?: string; bio?: string },
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['tenant'],
    });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.bio !== undefined) user.bio = dto.bio;

    const saved = await this.userRepository.save(user);
    await this.invalidateUserCache(userId);
    return saved;
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    const isValid = await user.validatePassword(dto.currentPassword);
    if (!isValid) throw new BadRequestException('كلمة المرور الحالية غير صحيحة');

    user.passwordHash = await User.hashPassword(dto.newPassword);
    if (user.mustChangePassword) {
      user.mustChangePassword = false;
    }
    await this.userRepository.save(user);
    await this.invalidateUserCache(userId);
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['tenant'],
    });

    if (!user) throw new BadRequestException('المستخدم غير موجود');
    return this.sanitizeUser(user);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; resetLink?: string }> {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });

    // Don't reveal whether the email exists
    if (!user) {
      return { message: 'إذا كان البريد موجوداً، سيتم إرسال رابط إعادة تعيين كلمة المرور' };
    }

    // Invalidate existing unused tokens
    await this.resetTokenRepository.update({ userId: user.id, isUsed: false }, { isUsed: true });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.resetTokenRepository.save({
      token,
      userId: user.id,
      expiresAt,
      isUsed: false,
    });

    const resetLink = `${this.configService.get<string>('app.frontendUrl', 'http://localhost:3000')}/auth/reset-password?token=${token}`;

    const isDev = this.configService.get<string>('app.nodeEnv', 'development') !== 'production';
    if (isDev) {
      console.log(`[DEV] Password reset link: ${resetLink}`);
    }

    return {
      message: 'إذا كان البريد موجوداً، سيتم إرسال رابط إعادة تعيين كلمة المرور',
      ...(isDev && { resetLink }),
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const resetToken = await this.resetTokenRepository.findOne({
      where: { token: dto.token, isUsed: false },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException('الرمز غير صالح أو منتهي الصلاحية');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('الرمز منتهي الصلاحية');
    }

    resetToken.user.passwordHash = await User.hashPassword(dto.password);
    await this.userRepository.save(resetToken.user);

    resetToken.isUsed = true;
    resetToken.usedAt = new Date();
    await this.resetTokenRepository.save(resetToken);

    return { message: 'تم إعادة تعيين كلمة المرور بنجاح' };
  }

  private async generateTokens(user: User) {
    const jti = crypto.randomUUID();

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.keyRotationService.signAsync(payload, {
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(
        { ...payload, jti },
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
          expiresIn: this.configService.get<string>(AuthService.REFRESH_TOKEN_TTL_KEY),
        },
      ),
    ]);

    return { accessToken, refreshToken, refreshTokenJti: jti };
  }

  private async storeRefreshToken(userId: string, jti: string, token: string): Promise<void> {
    const ttlSeconds = this.parseExpirationToSeconds(
      this.configService.get<string>(AuthService.REFRESH_TOKEN_TTL_KEY, '7d'),
    );

    await this.redisService.set(
      `${AuthService.REFRESH_TOKEN_PREFIX}${userId}:${jti}`,
      token,
      ttlSeconds,
    );
  }

  private async revokeAllUserTokens(userId: string): Promise<void> {
    await this.redisService.delPattern(`${AuthService.REFRESH_TOKEN_PREFIX}${userId}:*`);
    this.logger.log(`All refresh tokens revoked for user ${userId}`);
  }

  private parseExpirationToSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60; // default 7 days

    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 7 * 24 * 60 * 60;
    }
  }

  private async invalidateUserCache(userId: string): Promise<void> {
    await this.redisService.del(`user:${userId}`);
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      bio: user.bio,
      role: user.role,
      roleId: user.roleId,
      tenantId: user.tenantId,
      avatarUrl: user.avatarUrl,
      themePreference: user.themePreference || 'system',
      preferences: user.preferences || {},
      tenant: user.tenant ? { id: user.tenant.id, name: user.tenant.name } : null,
    };
  }
}
