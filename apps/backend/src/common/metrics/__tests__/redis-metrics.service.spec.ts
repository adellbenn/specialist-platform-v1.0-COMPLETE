jest.mock('../metrics.module', () => {
  const inc = jest.fn();
  const observe = jest.fn();
  return {
    redisOpsTotal: { labels: jest.fn(() => ({ inc })) },
    redisOperationDuration: { labels: jest.fn(() => ({ observe })) },
  };
});

import { RedisMetricsService } from '../redis-metrics.service';
import { redisOpsTotal, redisOperationDuration } from '../metrics.module';

describe('RedisMetricsService', () => {
  let service: RedisMetricsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RedisMetricsService();
  });

  describe('recordHit', () => {
    it('increments hit counter and observes duration', () => {
      service.recordHit('get', 5);
      expect(redisOpsTotal.labels).toHaveBeenCalledWith('get', 'hit');
      expect(redisOperationDuration.labels).toHaveBeenCalledWith('get');
    });
  });

  describe('recordMiss', () => {
    it('increments miss counter and observes duration', () => {
      service.recordMiss('get', 10);
      expect(redisOpsTotal.labels).toHaveBeenCalledWith('get', 'miss');
      expect(redisOperationDuration.labels).toHaveBeenCalledWith('get');
    });
  });

  describe('recordOperation', () => {
    it('increments success counter', () => {
      service.recordOperation('set', 3, true);
      expect(redisOpsTotal.labels).toHaveBeenCalledWith('set', 'success');
    });

    it('increments error counter', () => {
      service.recordOperation('set', 3, false);
      expect(redisOpsTotal.labels).toHaveBeenCalledWith('set', 'error');
    });
  });
});
