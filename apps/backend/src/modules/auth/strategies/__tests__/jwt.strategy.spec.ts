import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { JwtStrategy, extractJwtKid } from '../jwt.strategy';
import { User } from '@modules/users/user.entity';
import { RedisService } from '@common/redis/redis.service';
import { KeyRotationService } from '@common/auth/key-rotation.service';

jest.mock('passport-jwt', () => {
  return {
    ExtractJwt: {
      fromAuthHeaderAsBearerToken: jest.fn().mockReturnValue('extracted-token'),
    },
    Strategy: jest.fn().mockImplementation(function (this: any, opts: any) {
      this.jwtFromRequest = opts.jwtFromRequest;
      this.ignoreExpiration = opts.ignoreExpiration;
      this.secretOrKey = opts.secretOrKey;
      this.secretOrKeyProvider = opts.secretOrKeyProvider;
    }),
  };
});

jest.mock('@nestjs/passport', () => {
  return {
    PassportStrategy: jest.fn().mockImplementation((Strategy: any, name?: string) => {
      return class MockStrategy {
        static __lastOpts: any;
        constructor(opts: any) {
          MockStrategy.__lastOpts = opts;
        }
      };
    }),
  };
});

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepo: any;
  let redisService: any;
  let keyRotationService: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    passwordHash: '$2b$12$secret',
    isActive: true,
    role: 'specialist',
    tenantId: 'tenant-1',
  };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
    };

    redisService = {
      getJson: jest.fn(),
      setJson: jest.fn(),
    };

    keyRotationService = {
      getSecretForKey: jest.fn().mockReturnValue('test-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: RedisService, useValue: redisService },
        { provide: KeyRotationService, useValue: keyRotationService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('secretOrKeyProvider', () => {
    function strategyOpts() {
      const MockStrategy = (PassportStrategy as jest.Mock).mock.results[0].value;
      return MockStrategy.__lastOpts;
    }

    it('resolves the verification secret through KeyRotationService', () => {
      const opts = strategyOpts();
      expect(opts.secretOrKeyProvider).toBeDefined();

      const done = jest.fn();
      opts.secretOrKeyProvider({}, 'raw.token.sig', done);

      expect(keyRotationService.getSecretForKey).toHaveBeenCalledWith(undefined);
      expect(done).toHaveBeenCalledWith(null, 'test-secret');
    });

    it('passes the token kid to KeyRotationService', () => {
      const opts = strategyOpts();
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', kid: 'v0' })).toString('base64url');
      keyRotationService.getSecretForKey.mockReturnValue('previous-secret');

      const done = jest.fn();
      opts.secretOrKeyProvider({}, `${header}.payload.sig`, done);

      expect(keyRotationService.getSecretForKey).toHaveBeenCalledWith('v0');
      expect(done).toHaveBeenCalledWith(null, 'previous-secret');
    });
  });

  describe('extractJwtKid', () => {
    it('returns the kid from the token header', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', kid: 'v2' })).toString('base64url');
      expect(extractJwtKid(`${header}.payload.sig`)).toBe('v2');
    });

    it('returns undefined when the header has no kid', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
      expect(extractJwtKid(`${header}.payload.sig`)).toBeUndefined();
    });

    it('returns undefined for malformed tokens', () => {
      expect(extractJwtKid('not-a-jwt')).toBeUndefined();
      expect(extractJwtKid('')).toBeUndefined();
    });
  });

  describe('validate', () => {
    it('should return cached user if available and active', async () => {
      const cachedUser = { ...mockUser };
      redisService.getJson.mockResolvedValue(cachedUser);

      const result = await strategy.validate({
        sub: 'user-1',
        email: 'test@example.com',
        role: 'specialist',
        tenantId: 'tenant-1',
      });

      expect(result).toEqual(cachedUser);
      expect(userRepo.findOne).not.toHaveBeenCalled();
    });

    it('should throw if cached user is not active', async () => {
      redisService.getJson.mockResolvedValue({ ...mockUser, isActive: false });
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        strategy.validate({ sub: 'user-1', email: 'a@b.com', role: 'r', tenantId: 't' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should query DB on cache miss', async () => {
      redisService.getJson.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate({
        sub: 'user-1',
        email: 'test@example.com',
        role: 'specialist',
        tenantId: 'tenant-1',
      });

      expect(result).toEqual(mockUser);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1', isActive: true },
      });
    });

    it('should cache user after DB fetch', async () => {
      redisService.getJson.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue(mockUser);

      await strategy.validate({
        sub: 'user-1',
        email: 'test@example.com',
        role: 'specialist',
        tenantId: 'tenant-1',
      });

      expect(redisService.setJson).toHaveBeenCalledWith(
        'user:user-1',
        expect.not.objectContaining({ passwordHash: expect.any(String) }),
        300,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      redisService.getJson.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        strategy.validate({ sub: 'user-1', email: 'a@b.com', role: 'r', tenantId: 't' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should strip passwordHash from cached user', async () => {
      redisService.getJson.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue(mockUser);

      await strategy.validate({
        sub: 'user-1',
        email: 'test@example.com',
        role: 'specialist',
        tenantId: 'tenant-1',
      });

      const cachedArg = redisService.setJson.mock.calls[0][1];
      expect(cachedArg).not.toHaveProperty('passwordHash');
      expect(cachedArg).toHaveProperty('id', 'user-1');
    });
  });
});
