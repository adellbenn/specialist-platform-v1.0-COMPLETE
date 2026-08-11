import { Test, TestingModule } from '@nestjs/testing';
import { DeviceSessionsService, DeviceSession } from '../device-sessions.service';
import { RedisService } from '@common/redis/redis.service';
import * as crypto from 'crypto';

describe('DeviceSessionsService', () => {
  let service: DeviceSessionsService;
  let redisService: any;

  beforeEach(async () => {
    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delPattern: jest.fn(),
      getJson: jest.fn(),
      setJson: jest.fn(),
      scan: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceSessionsService,
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<DeviceSessionsService>(DeviceSessionsService);
  });

  describe('generateDeviceId', () => {
    it('should generate a 16-char hex SHA256 hash', () => {
      const id = service.generateDeviceId('Mozilla/5.0', '127.0.0.1');

      expect(id).toHaveLength(16);
      expect(id).toMatch(/^[a-f0-9]{16}$/);
    });

    it('should produce different IDs for different inputs', () => {
      const id1 = service.generateDeviceId('UA1', '1.1.1.1');
      const id2 = service.generateDeviceId('UA2', '2.2.2.2');

      expect(id1).not.toBe(id2);
    });

    it('should produce same ID for same inputs', () => {
      const id1 = service.generateDeviceId('Mozilla/5.0', '127.0.0.1');
      const id2 = service.generateDeviceId('Mozilla/5.0', '127.0.0.1');

      expect(id1).toBe(id2);
    });
  });

  describe('createSession', () => {
    it('should store session in Redis and return deviceId', async () => {
      const deviceId = await service.createSession(
        'user-1',
        'Mozilla/5.0',
        '127.0.0.1',
        'jti-123',
      );

      expect(deviceId).toHaveLength(16);
      expect(redisService.setJson).toHaveBeenCalledWith(
        `session:user-1:${deviceId}`,
        expect.objectContaining({
          deviceId,
          userAgent: 'Mozilla/5.0',
          ip: '127.0.0.1',
          refreshTokenJti: 'jti-123',
          lastActive: expect.any(String),
          createdAt: expect.any(String),
        }),
        604800,
      );
      expect(redisService.set).toHaveBeenCalledWith(
        `sessionlist:user-1:${deviceId}`,
        '1',
        604800,
      );
    });

    it('should return consistent deviceId for same inputs', async () => {
      const id1 = await service.createSession('user-1', 'UA', 'IP', 'jti1');
      const id2 = await service.createSession('user-1', 'UA', 'IP', 'jti2');

      expect(id1).toBe(id2);
    });
  });

  describe('updateLastActive', () => {
    it('should update lastActive timestamp in Redis', async () => {
      const session: DeviceSession = {
        deviceId: 'dev-1',
        userAgent: 'UA',
        ip: 'IP',
        lastActive: '2024-01-01T00:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        refreshTokenJti: 'jti-1',
      };
      redisService.getJson.mockResolvedValue(session);
      redisService.setJson.mockResolvedValue(undefined);

      await service.updateLastActive('user-1', 'dev-1');

      expect(redisService.getJson).toHaveBeenCalledWith('session:user-1:dev-1');
      expect(redisService.setJson).toHaveBeenCalledWith(
        'session:user-1:dev-1',
        expect.objectContaining({ lastActive: expect.any(String) }),
        604800,
      );
    });

    it('should not throw if session not found', async () => {
      redisService.getJson.mockResolvedValue(null);

      await expect(
        service.updateLastActive('user-1', 'nonexistent'),
      ).resolves.toBeUndefined();

      expect(redisService.setJson).not.toHaveBeenCalled();
    });
  });

  describe('getActiveSessions', () => {
    it('should return sorted sessions', async () => {
      const session1: DeviceSession = {
        deviceId: 'dev-1',
        userAgent: 'UA1',
        ip: 'IP1',
        lastActive: '2024-01-01T10:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        refreshTokenJti: 'jti-1',
      };
      const session2: DeviceSession = {
        deviceId: 'dev-2',
        userAgent: 'UA2',
        ip: 'IP2',
        lastActive: '2024-01-01T12:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        refreshTokenJti: 'jti-2',
      };

      redisService.scan
        .mockResolvedValueOnce(['0', ['session:user-1:dev-1', 'session:user-1:dev-2']])
        .mockResolvedValue(['0', []]);

      redisService.getJson
        .mockResolvedValueOnce(session1)
        .mockResolvedValueOnce(session2);

      const result = await service.getActiveSessions('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].deviceId).toBe('dev-2');
      expect(result[1].deviceId).toBe('dev-1');
    });

    it('should return empty array on Redis error', async () => {
      redisService.scan.mockRejectedValue(new Error('Redis down'));

      const result = await service.getActiveSessions('user-1');

      expect(result).toEqual([]);
    });

    it('should return empty array when no sessions', async () => {
      redisService.scan.mockResolvedValue(['0', []]);

      const result = await service.getActiveSessions('user-1');

      expect(result).toEqual([]);
    });

    it('should handle multi-page scan', async () => {
      redisService.scan
        .mockResolvedValueOnce(['123', ['session:user-1:dev-1']])
        .mockResolvedValueOnce(['0', ['session:user-1:dev-2']]);

      redisService.getJson
        .mockResolvedValueOnce({ deviceId: 'dev-1' } as DeviceSession)
        .mockResolvedValueOnce({ deviceId: 'dev-2' } as DeviceSession);

      const result = await service.getActiveSessions('user-1');

      expect(result).toHaveLength(2);
    });

    it('should skip null sessions from getJson', async () => {
      redisService.scan.mockResolvedValue(['0', ['session:user-1:dev-1', 'session:user-1:dev-2']]);
      redisService.getJson
        .mockResolvedValueOnce({ deviceId: 'dev-1' } as DeviceSession)
        .mockResolvedValueOnce(null);

      const result = await service.getActiveSessions('user-1');

      expect(result).toHaveLength(1);
    });
  });

  describe('revokeSession', () => {
    it('should delete session and sessionlist keys', async () => {
      await service.revokeSession('user-1', 'dev-1');

      expect(redisService.del).toHaveBeenCalledWith('session:user-1:dev-1');
      expect(redisService.del).toHaveBeenCalledWith('sessionlist:user-1:dev-1');
    });
  });

  describe('revokeAllSessions', () => {
    it('should delete all session and sessionlist patterns', async () => {
      await service.revokeAllSessions('user-1');

      expect(redisService.delPattern).toHaveBeenCalledWith('session:user-1:*');
      expect(redisService.delPattern).toHaveBeenCalledWith('sessionlist:user-1:*');
    });
  });

  describe('revokeByRefreshTokenJti', () => {
    it('should revoke session matching the jti', async () => {
      const session: DeviceSession = {
        deviceId: 'dev-1',
        userAgent: 'UA',
        ip: 'IP',
        lastActive: '2024-01-01T00:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        refreshTokenJti: 'target-jti',
      };

      redisService.scan.mockResolvedValue(['0', ['session:user-1:dev-1']]);
      redisService.getJson.mockResolvedValue(session);

      await service.revokeByRefreshTokenJti('user-1', 'target-jti');

      expect(redisService.del).toHaveBeenCalledWith('session:user-1:dev-1');
      expect(redisService.del).toHaveBeenCalledWith('sessionlist:user-1:dev-1');
    });

    it('should do nothing if no session matches jti', async () => {
      const session: DeviceSession = {
        deviceId: 'dev-1',
        userAgent: 'UA',
        ip: 'IP',
        lastActive: '2024-01-01T00:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        refreshTokenJti: 'other-jti',
      };

      redisService.scan.mockResolvedValue(['0', ['session:user-1:dev-1']]);
      redisService.getJson.mockResolvedValue(session);

      await service.revokeByRefreshTokenJti('user-1', 'target-jti');

      expect(redisService.del).not.toHaveBeenCalledWith('session:user-1:dev-1');
    });

    it('should handle empty sessions list', async () => {
      redisService.scan.mockResolvedValue(['0', []]);

      await service.revokeByRefreshTokenJti('user-1', 'jti');

      expect(redisService.del).not.toHaveBeenCalled();
    });
  });
});
