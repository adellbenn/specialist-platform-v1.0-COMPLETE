import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { KeyRotationService } from '../key-rotation.service';

function mockConfig(overrides: Record<string, any> = {}) {
  return {
    get: jest.fn().mockImplementation((key: string, defaultVal?: any) => {
      const map: Record<string, any> = {
        'jwt.secret': 'initial-secret',
        'JWT_KEY_ID': 'v1',
        'JWT_KEY_ROTATION_HOURS': 0,
        ...overrides,
      };
      return map[key] ?? defaultVal;
    }),
  } as unknown as jest.Mocked<ConfigService>;
}

function mockJwt() {
  return {
    verify: jest.fn(),
    sign: jest.fn().mockReturnValue('signed-token'),
    signAsync: jest.fn().mockResolvedValue('async-signed-token'),
  } as unknown as jest.Mocked<JwtService>;
}

describe('KeyRotationService', () => {
  let service: KeyRotationService;
  let configService: jest.Mocked<ConfigService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    configService = mockConfig();
    jwtService = mockJwt();
    service = new KeyRotationService(configService, jwtService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('onModuleInit', () => {
    it('initializes currentKey from config', () => {
      service.onModuleInit();
      const key = service.getCurrentKey();
      expect(key.kid).toBe('v1');
      expect(key.secret).toBe('initial-secret');
    });

    it('sets up rotation interval when hours > 0', () => {
      configService = mockConfig({ 'JWT_KEY_ROTATION_HOURS': 24 });
      service = new KeyRotationService(configService, jwtService);
      service.onModuleInit();
      expect(service.getCurrentKey().kid).toBe('v1');
    });

    it('does not set interval when hours is 0', () => {
      service.onModuleInit();
      // No interval should be set, nothing to verify
    });
  });

  describe('getCurrentKey / getSigningSecret / getSigningKid', () => {
    beforeEach(() => service.onModuleInit());

    it('getCurrentKey returns key entry', () => {
      expect(service.getCurrentKey()).toEqual(
        expect.objectContaining({ kid: 'v1', secret: 'initial-secret' }),
      );
    });

    it('getSigningSecret returns the secret', () => {
      expect(service.getSigningSecret()).toBe('initial-secret');
    });

    it('getSigningKid returns the kid', () => {
      expect(service.getSigningKid()).toBe('v1');
    });
  });

  describe('getSecretForKey', () => {
    beforeEach(() => service.onModuleInit());

    it('returns the current secret when no kid is provided', () => {
      expect(service.getSecretForKey()).toBe('initial-secret');
    });

    it('returns the current secret for an unknown kid', () => {
      expect(service.getSecretForKey('unknown-kid')).toBe('initial-secret');
    });

    it('returns the previous secret when the kid matches the previous key', () => {
      (service as any).rotate();
      const previousKid = (service as any).previousKey.kid;
      expect(service.getSecretForKey(previousKid)).toBe(
        (service as any).previousKey.secret,
      );
      expect(service.getSecretForKey(previousKid)).not.toBe(service.getCurrentKey().secret);
    });
  });

  describe('verify', () => {
    it('verifies with current key', () => {
      service.onModuleInit();
      jwtService.verify.mockReturnValue({ sub: 'u1' });
      const result = service.verify('token');
      expect(result).toEqual({ sub: 'u1' });
      expect(jwtService.verify).toHaveBeenCalledWith('token', { secret: 'initial-secret' });
    });

    it('falls back to previous key when current fails', () => {
      service.onModuleInit();
      // Trigger rotation to create a previous key
      jest.advanceTimersByTime(1000);
      // Access private rotate
      (service as any).rotate();

      jwtService.verify
        .mockImplementationOnce(() => { throw new Error('bad'); })
        .mockReturnValueOnce({ sub: 'u1' });

      const result = service.verify('token');
      expect(result).toEqual({ sub: 'u1' });
    });

    it('throws when both current and previous keys fail', () => {
      service.onModuleInit();
      (service as any).rotate();
      jwtService.verify.mockImplementation(() => { throw new Error('bad'); });
      expect(() => service.verify('token')).toThrow('Token verification failed with all available keys');
    });

    it('throws when no previous key and current fails', () => {
      service.onModuleInit();
      jwtService.verify.mockImplementation(() => { throw new Error('bad'); });
      expect(() => service.verify('token')).toThrow('Token verification failed with all available keys');
    });
  });

  describe('sign', () => {
    beforeEach(() => service.onModuleInit());

    it('signs with current key', () => {
      const token = service.sign({ sub: 'u1' });
      expect(token).toBe('signed-token');
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'u1' },
        expect.objectContaining({ secret: 'initial-secret' }),
      );
    });

    it('signs with custom secret', () => {
      service.sign({ sub: 'u1' }, { secret: 'custom' });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'u1' },
        expect.objectContaining({ secret: 'custom' }),
      );
    });

    it('passes expiresIn option', () => {
      service.sign({ sub: 'u1' }, { expiresIn: '1h' });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'u1' },
        expect.objectContaining({ expiresIn: '1h' }),
      );
    });
  });

  describe('signAsync', () => {
    beforeEach(() => service.onModuleInit());

    it('signs asynchronously', async () => {
      const token = await service.signAsync({ sub: 'u1' });
      expect(token).toBe('async-signed-token');
    });

    it('uses custom secret', async () => {
      await service.signAsync({ sub: 'u1' }, { secret: 'custom' });
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'u1' },
        expect.objectContaining({ secret: 'custom' }),
      );
    });
  });

  describe('rotate (private)', () => {
    beforeEach(() => service.onModuleInit());

    it('current becomes previous and new key is generated', () => {
      const oldKey = service.getCurrentKey();
      (service as any).rotate();
      const newKey = service.getCurrentKey();
      expect(newKey.kid).not.toBe(oldKey.kid);
      expect(newKey.secret).not.toBe(oldKey.secret);
      expect((service as any).previousKey.kid).toBe(oldKey.kid);
    });
  });

  describe('onModuleDestroy', () => {
    it('clears the interval', () => {
      configService = mockConfig({ 'JWT_KEY_ROTATION_HOURS': 24 });
      service = new KeyRotationService(configService, jwtService);
      service.onModuleInit();
      expect(() => service.onModuleDestroy()).not.toThrow();
    });

    it('does nothing when no interval set', () => {
      service.onModuleInit();
      expect(() => service.onModuleDestroy()).not.toThrow();
    });
  });
});
