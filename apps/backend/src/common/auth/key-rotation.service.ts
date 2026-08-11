import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

/**
 * JWT Key Rotation Service
 *
 * Manages current + previous signing keys for JWT tokens.
 * Rotation happens automatically based on JWT_KEY_ROTATION_HOURS.
 *
 * Access tokens are signed with the current key.
 * Verification tries current first, then previous (grace period).
 */

export interface JwtKeyEntry {
  kid: string;
  secret: string;
  createdAt: number;
}

@Injectable()
export class KeyRotationService implements OnModuleInit {
  private readonly logger = new Logger(KeyRotationService.name);
  private currentKey: JwtKeyEntry;
  private previousKey: JwtKeyEntry | null = null;
  private rotationInterval: ReturnType<typeof setInterval> | null = null;

  private static readonly STORAGE_KEY_CURRENT = 'jwt:keys:current';
  private static readonly STORAGE_KEY_PREVIOUS = 'jwt:keys:previous';

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  onModuleInit() {
    const currentSecret = this.configService.get<string>('jwt.secret') || '';
    const currentKid = this.configService.get<string>('JWT_KEY_ID') || 'v1';
    const rotationHours = this.configService.get<number>('JWT_KEY_ROTATION_HOURS') || 0;

    this.currentKey = {
      kid: currentKid,
      secret: currentSecret,
      createdAt: Date.now(),
    };

    // If rotation is enabled (hours > 0), set up automatic rotation
    if (rotationHours > 0) {
      const intervalMs = rotationHours * 60 * 60 * 1000;
      this.rotationInterval = setInterval(() => this.rotate(), intervalMs);
      this.logger.log(`JWT key rotation enabled every ${rotationHours}h`);
    }
  }

  /**
   * Get the current signing key for new tokens
   */
  getCurrentKey(): JwtKeyEntry {
    return this.currentKey;
  }

  /**
   * Get the secret to sign a new token
   */
  getSigningSecret(): string {
    return this.currentKey.secret;
  }

  /**
   * Get the kid (key ID) to embed in JWT header
   */
  getSigningKid(): string {
    return this.currentKey.kid;
  }

  /**
   * Resolve the signing secret for a token's kid (key ID).
   * Returns the previous key's secret when the kid matches it (grace period),
   * otherwise the current key's secret. Used by the JwtStrategy during
   * verification so tokens signed before a rotation remain valid.
   */
  getSecretForKey(kid?: string): string {
    if (kid && this.previousKey && this.previousKey.kid === kid) {
      return this.previousKey.secret;
    }
    return this.currentKey.secret;
  }

  /**
   * Verify a token — tries current key first, then previous
   * Returns the decoded payload or throws
   */
  verify(token: string): any {
    // Try current key first
    try {
      return this.jwtService.verify(token, { secret: this.currentKey.secret });
    } catch {
      // Current key failed — try previous if exists
    }

    if (this.previousKey) {
      try {
        return this.jwtService.verify(token, { secret: this.previousKey.secret });
      } catch {
        // Both keys failed
      }
    }

    throw new Error('Token verification failed with all available keys');
  }

  /**
   * Sign a token with the current key
   */
  sign(payload: Record<string, any>, options: { expiresIn?: string; secret?: string } = {}): string {
    const secret = options.secret || this.currentKey.secret;
    const signOptions: Record<string, any> = {
      secret,
      expiresIn: options.expiresIn,
    };
    if (!options.secret) {
      signOptions.keyid = this.currentKey.kid;
    }
    return this.jwtService.sign(payload, signOptions);
  }

  async signAsync(
    payload: Record<string, any>,
    options: { expiresIn?: string; secret?: string } = {},
  ): Promise<string> {
    const secret = options.secret || this.currentKey.secret;
    const signOptions: Record<string, any> = {
      secret,
      expiresIn: options.expiresIn,
    };
    if (!options.secret) {
      signOptions.keyid = this.currentKey.kid;
    }
    return this.jwtService.signAsync(payload, signOptions);
  }

  /**
   * Rotate keys: current → previous, generate new current
   */
  private rotate() {
    this.previousKey = { ...this.currentKey };
    this.currentKey = {
      kid: `v${Date.now()}`,
      secret: crypto.randomBytes(64).toString('hex'),
      createdAt: Date.now(),
    };

    this.logger.log(
      `JWT keys rotated — new kid: ${this.currentKey.kid}, previous kid: ${this.previousKey.kid}`,
    );
    this.logger.log(
      `Previous key will remain valid for verification until next rotation`,
    );
  }

  onModuleDestroy() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
    }
  }
}
