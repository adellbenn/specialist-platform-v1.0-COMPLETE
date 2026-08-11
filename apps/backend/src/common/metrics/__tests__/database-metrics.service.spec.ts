jest.mock('../metrics.module', () => {
  const observe = jest.fn();
  const set = jest.fn();
  return {
    dbQueryDuration: { labels: jest.fn(() => ({ observe })) },
    dbHealthStatus: { set },
  };
});

import { DatabaseMetricsService } from '../database-metrics.service';
import { dbQueryDuration, dbHealthStatus } from '../metrics.module';

describe('DatabaseMetricsService', () => {
  let service: DatabaseMetricsService;
  let dataSource: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    dataSource = { query: jest.fn().mockResolvedValue(undefined) };
    service = new DatabaseMetricsService(dataSource);
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.useRealTimers();
  });

  describe('recordQuery', () => {
    it('observes query duration', () => {
      service.recordQuery('findAll', 42);
      expect(dbQueryDuration.labels).toHaveBeenCalledWith('findAll');
    });
  });

  describe('health checks', () => {
    it('runs health check on interval', async () => {
      jest.advanceTimersByTime(30000);
      await Promise.resolve();
      expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
      expect(dbHealthStatus.set).toHaveBeenCalledWith(1);
    });

    it('sets health to 0 on query failure', async () => {
      dataSource.query.mockRejectedValueOnce(new Error('db down'));
      jest.advanceTimersByTime(30000);
      await Promise.resolve();
      expect(dbHealthStatus.set).toHaveBeenCalledWith(0);
    });
  });

  describe('onModuleDestroy', () => {
    it('clears the interval', () => {
      service.onModuleDestroy();
      jest.advanceTimersByTime(60000);
      // Should not call query after destroy
      expect(dataSource.query).not.toHaveBeenCalled();
    });
  });
});
