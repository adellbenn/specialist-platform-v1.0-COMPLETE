import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';
import { User } from '@modules/users/user.entity';
import { RedisService } from '@common/redis/redis.service';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);
  private static readonly TEMP_TOKEN_PREFIX = '2fa:temp:';
  private static readonly TEMP_TOKEN_TTL = 300; // 5 minutes
  private static readonly BACKUP_CODES_COUNT = 10;

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async generateSecret(userId: string): Promise<{
    secret: string;
    otpauthUrl: string;
    backupCodes: string[];
  }> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new BadRequestException('User not found');
    if (user.twoFactorEnabled) throw new BadRequestException('2FA is already enabled');

    const secret = speakeasy.generateSecret({
      name: `SpecialistPlatform (${user.email})`,
      issuer: 'SpecialistPlatform',
    });

    const backupCodes = Array.from({ length: TwoFactorService.BACKUP_CODES_COUNT }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );

    // Store secret + backup codes temporarily in Redis until verified
    await this.redisService.setJson(
      `${TwoFactorService.TEMP_TOKEN_PREFIX}setup:${userId}`,
      { secret: secret.base32, backupCodes },
      TwoFactorService.TEMP_TOKEN_TTL * 2,
    );

    return { secret: secret.base32 || '', otpauthUrl: secret.otpauth_url || '', backupCodes };
  }

  async verifyAndEnable(userId: string, code: string): Promise<void> {
    const setupData = await this.redisService.getJson<{ secret: string; backupCodes: string[] }>(
      `${TwoFactorService.TEMP_TOKEN_PREFIX}setup:${userId}`,
    );
    if (!setupData) throw new BadRequestException('Setup session expired. Generate a new secret.');

    const isValid = speakeasy.totp.verify({
      secret: setupData.secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });
    if (!isValid) throw new BadRequestException('Invalid verification code');

    await this.userRepo.update(userId, {
      twoFactorSecret: setupData.secret,
      twoFactorEnabled: true,
      twoFactorBackupCodes: JSON.stringify(setupData.backupCodes),
    });

    await this.redisService.del(`${TwoFactorService.TEMP_TOKEN_PREFIX}setup:${userId}`);
    this.logger.log(`2FA enabled for user ${userId}`);
  }

  async disable(userId: string, password: string, code: string): Promise<void> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new BadRequestException('User not found');
    if (!user.twoFactorEnabled) throw new BadRequestException('2FA is not enabled');

    const passwordValid = await user.validatePassword(password);
    if (!passwordValid) throw new UnauthorizedException('Invalid password');

    // Verify current TOTP code
    if (user.twoFactorSecret) {
      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: 1,
      });
      if (!isValid) throw new BadRequestException('Invalid verification code');
    }

    await this.userRepo.update(userId, {
      twoFactorSecret: null as any,
      twoFactorEnabled: false,
      twoFactorBackupCodes: null as any,
    });

    this.logger.log(`2FA disabled for user ${userId}`);
  }

  async verifyLogin(user: User, code: string): Promise<boolean> {
    // Try TOTP first
    if (user.twoFactorSecret) {
      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: 1,
      });
      if (isValid) return true;
    }

    // Try backup codes
    if (user.twoFactorBackupCodes) {
      let backupCodes: string[];
      try {
        backupCodes = JSON.parse(user.twoFactorBackupCodes);
      } catch {
        backupCodes = [];
      }
      const codeUpper = code.toUpperCase();
      const index = backupCodes.indexOf(codeUpper);
      if (index !== -1) {
        // Remove used backup code
        backupCodes.splice(index, 1);
        await this.userRepo.update(user.id, {
          twoFactorBackupCodes: JSON.stringify(backupCodes),
        });
        this.logger.log(`Backup code used for user ${user.id}`);
        return true;
      }
    }

    return false;
  }

  async createTempToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      type: '2fa_pending',
    };
    const tempToken = this.jwtService.sign(payload, { expiresIn: '5m' });

    await this.redisService.set(
      `${TwoFactorService.TEMP_TOKEN_PREFIX}${user.id}`,
      tempToken,
      TwoFactorService.TEMP_TOKEN_TTL,
    );

    return tempToken;
  }

  async verifyTempToken(tempToken: string): Promise<{ sub: string; email: string }> {
    try {
      const payload = this.jwtService.verify(tempToken);
      if (payload.type !== '2fa_pending') throw new Error('Invalid token type');

      const stored = await this.redisService.get(
        `${TwoFactorService.TEMP_TOKEN_PREFIX}${payload.sub}`,
      );
      if (!stored || stored !== tempToken) throw new Error('Token not found or expired');

      await this.redisService.del(`${TwoFactorService.TEMP_TOKEN_PREFIX}${payload.sub}`);
      return { sub: payload.sub, email: payload.email };
    } catch {
      throw new UnauthorizedException('Invalid or expired 2FA token');
    }
  }

  async getStatus(userId: string): Promise<{ enabled: boolean; backupCodesRemaining: number }> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new BadRequestException('User not found');

    let backupCodesRemaining = 0;
    if (user.twoFactorBackupCodes) {
      try {
        backupCodesRemaining = JSON.parse(user.twoFactorBackupCodes).length;
      } catch {
        backupCodesRemaining = 0;
      }
    }

    return {
      enabled: user.twoFactorEnabled,
      backupCodesRemaining,
    };
  }
}
