import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@modules/users/user.entity';
import { RedisService } from '@common/redis/redis.service';
import { KeyRotationService } from '@common/auth/key-rotation.service';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
  tenantId: string | null;
  jti?: string; // unique token id for refresh token rotation
}

/**
 * Extract the key id (kid) from a JWT header.
 * Returns undefined when the token has no parseable header.
 */
export function extractJwtKid(token: string): string | undefined {
  const header = token.split('.')[0];
  if (!header) return undefined;
  try {
    const decoded = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'));
    return typeof decoded?.kid === 'string' ? decoded.kid : undefined;
  } catch {
    return undefined;
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private static readonly CACHE_PREFIX = 'user:';
  private static readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private redisService: RedisService,
    private keyRotationService: KeyRotationService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (
        _request: any,
        rawJwtToken: string,
        done: (err: Error | null, secretOrKey?: string) => void,
      ) => {
        try {
          const kid = extractJwtKid(rawJwtToken);
          done(null, this.keyRotationService.getSecretForKey(kid));
        } catch (err) {
          done(err as Error);
        }
      },
    });
  }

  async validate(payload: JwtPayload) {
    // Try cache first
    const cacheKey = `${JwtStrategy.CACHE_PREFIX}${payload.sub}`;
    const cached = await this.redisService.getJson<Partial<User>>(cacheKey);
    if (cached && cached.id && cached.isActive) {
      return cached as User;
    }

    // Cache miss — query DB
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('المستخدم غير موجود أو غير نشط');
    }

    // Cache user (without sensitive fields)
    const { passwordHash, ...safeUser } = user as any;
    await this.redisService.setJson(cacheKey, safeUser, JwtStrategy.CACHE_TTL);

    return user;
  }
}
