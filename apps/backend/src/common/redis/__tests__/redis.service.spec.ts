import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis.service';

jest.mock('ioredis', () => {
  const Redis = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    scan: jest.fn(),
    quit: jest.fn(),
  }));
  return { __esModule: true, default: Redis };
});

function mockConfig(overrides: Record<string, any> = {}) {
  return {
    get: jest.fn().mockImplementation((key: string, defaultVal?: any) => {
      const map: Record<string, any> = {
        'redis.host': '127.0.0.1',
        'redis.port': 6379,
        'redis.password': '',
        'redis.keyPrefix': 'sp:',
        ...overrides,
      };
      return map[key] ?? defaultVal;
    }),
  } as unknown as jest.Mocked<ConfigService>;
}

describe('RedisService', () => {
  let service: RedisService;
  let configService: jest.Mocked<ConfigService>;
  let metricsService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    configService = mockConfig();
    metricsService = {
      recordHit: jest.fn(),
      recordMiss: jest.fn(),
      recordOperation: jest.fn(),
    };
    service = new RedisService(configService, metricsService);
    // Simulate connected state
    (service as any).isConnected = true;
  });

  describe('isAvailable', () => {
    it('returns true when connected', () => {
      (service as any).isConnected = true;
      expect(service.isAvailable()).toBe(true);
    });

    it('returns false when disconnected', () => {
      (service as any).isConnected = false;
      expect(service.isAvailable()).toBe(false);
    });
  });

  describe('get', () => {
    it('returns null when not connected', async () => {
      (service as any).isConnected = false;
      expect(await service.get('key')).toBeNull();
    });

    it('returns null when no client', async () => {
      (service as any).client = null;
      expect(await service.get('key')).toBeNull();
    });

    it('returns value when connected', async () => {
      const mockClient = { get: jest.fn().mockResolvedValue('val') };
      (service as any).client = mockClient;
      expect(await service.get('key')).toBe('val');
    });

    it('records hit metrics when value found', async () => {
      const mockClient = { get: jest.fn().mockResolvedValue('val') };
      (service as any).client = mockClient;
      await service.get('key');
      expect(metricsService.recordHit).toHaveBeenCalled();
    });

    it('records miss metrics when value not found', async () => {
      const mockClient = { get: jest.fn().mockResolvedValue(null) };
      (service as any).client = mockClient;
      await service.get('key');
      expect(metricsService.recordMiss).toHaveBeenCalled();
    });

    it('returns null on error and records failure', async () => {
      const mockClient = { get: jest.fn().mockRejectedValue(new Error('fail')) };
      (service as any).client = mockClient;
      expect(await service.get('key')).toBeNull();
      expect(metricsService.recordOperation).toHaveBeenCalledWith('get', expect.any(Number), false);
    });
  });

  describe('getJson', () => {
    it('returns parsed JSON when valid', async () => {
      const mockClient = { get: jest.fn().mockResolvedValue('{"a":1}') };
      (service as any).client = mockClient;
      expect(await service.getJson('key')).toEqual({ a: 1 });
    });

    it('returns null when get returns null', async () => {
      const mockClient = { get: jest.fn().mockResolvedValue(null) };
      (service as any).client = mockClient;
      expect(await service.getJson('key')).toBeNull();
    });

    it('returns null on JSON parse error', async () => {
      const mockClient = { get: jest.fn().mockResolvedValue('not-json') };
      (service as any).client = mockClient;
      expect(await service.getJson('key')).toBeNull();
    });
  });

  describe('set', () => {
    it('returns void when not connected', async () => {
      (service as any).isConnected = false;
      await expect(service.set('k', 'v')).resolves.toBeUndefined();
    });

    it('sets value without ttl', async () => {
      const mockClient = { set: jest.fn().mockResolvedValue('OK') };
      (service as any).client = mockClient;
      await service.set('k', 'v');
      expect(mockClient.set).toHaveBeenCalledWith('k', 'v');
    });

    it('sets value with EX when ttl provided', async () => {
      const mockClient = { set: jest.fn().mockResolvedValue('OK') };
      (service as any).client = mockClient;
      await service.set('k', 'v', 60);
      expect(mockClient.set).toHaveBeenCalledWith('k', 'v', 'EX', 60);
    });

    it('records success metrics', async () => {
      const mockClient = { set: jest.fn().mockResolvedValue('OK') };
      (service as any).client = mockClient;
      await service.set('k', 'v');
      expect(metricsService.recordOperation).toHaveBeenCalledWith('set', expect.any(Number), true);
    });

    it('records failure metrics on error', async () => {
      const mockClient = { set: jest.fn().mockRejectedValue(new Error('fail')) };
      (service as any).client = mockClient;
      await service.set('k', 'v');
      expect(metricsService.recordOperation).toHaveBeenCalledWith('set', expect.any(Number), false);
    });
  });

  describe('setJson', () => {
    it('stringifies and delegates to set', async () => {
      const mockClient = { set: jest.fn().mockResolvedValue('OK') };
      (service as any).client = mockClient;
      await service.setJson('k', { a: 1 });
      expect(mockClient.set).toHaveBeenCalledWith('k', '{"a":1}');
    });
  });

  describe('del', () => {
    it('returns void when not connected', async () => {
      (service as any).isConnected = false;
      await expect(service.del('k')).resolves.toBeUndefined();
    });

    it('delegates to client.del', async () => {
      const mockClient = { del: jest.fn().mockResolvedValue(1) };
      (service as any).client = mockClient;
      await service.del('k');
      expect(mockClient.del).toHaveBeenCalledWith('k');
    });

    it('records failure on error', async () => {
      const mockClient = { del: jest.fn().mockRejectedValue(new Error('fail')) };
      (service as any).client = mockClient;
      await service.del('k');
      expect(metricsService.recordOperation).toHaveBeenCalledWith('del', expect.any(Number), false);
    });
  });

  describe('delPattern', () => {
    it('returns void when not connected', async () => {
      (service as any).isConnected = false;
      await expect(service.delPattern('p:*')).resolves.toBeUndefined();
    });

    it('uses SCAN + DEL loop', async () => {
      const mockClient = {
        scan: jest.fn()
          .mockResolvedValueOnce(['0', ['key1', 'key2']]),
        del: jest.fn().mockResolvedValue(2),
      };
      (service as any).client = mockClient;
      await service.delPattern('p:*');
      expect(mockClient.scan).toHaveBeenCalledWith('0', 'MATCH', 'p:*', 'COUNT', 100);
      expect(mockClient.del).toHaveBeenCalledWith('key1', 'key2');
    });

    it('iterates multiple cursors', async () => {
      const mockClient = {
        scan: jest.fn()
          .mockResolvedValueOnce(['42', ['k1']])
          .mockResolvedValueOnce(['0', ['k2']]),
        del: jest.fn().mockResolvedValue(1),
      };
      (service as any).client = mockClient;
      await service.delPattern('p:*');
      expect(mockClient.del).toHaveBeenCalledTimes(2);
    });
  });

  describe('scan', () => {
    it('returns empty when not connected', async () => {
      (service as any).isConnected = false;
      const result = await service.scan('p:*');
      expect(result).toEqual(['0', []]);
    });

    it('delegates to client.scan', async () => {
      const mockClient = { scan: jest.fn().mockResolvedValue(['0', ['k1']]) };
      (service as any).client = mockClient;
      const result = await service.scan('p:*');
      expect(result).toEqual(['0', ['k1']]);
    });

    it('returns empty on error', async () => {
      const mockClient = { scan: jest.fn().mockRejectedValue(new Error('fail')) };
      (service as any).client = mockClient;
      const result = await service.scan('p:*');
      expect(result).toEqual(['0', []]);
    });
  });

  describe('onModuleDestroy', () => {
    it('calls quit on client', async () => {
      const mockClient = { quit: jest.fn().mockResolvedValue(undefined) };
      (service as any).client = mockClient;
      await service.onModuleDestroy();
      expect(mockClient.quit).toHaveBeenCalled();
    });

    it('handles quit failure gracefully', async () => {
      const mockClient = { quit: jest.fn().mockRejectedValue(new Error('fail')) };
      (service as any).client = mockClient;
      await expect(service.onModuleDestroy()).resolves.toBeUndefined();
    });
  });
});
