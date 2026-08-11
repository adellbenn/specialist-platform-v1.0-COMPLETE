import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from '../health.module';
import { DataSource } from 'typeorm';
import { RedisService } from '@common/redis/redis.service';

describe('HealthService', () => {
  let service: HealthService;
  let dataSource: jest.Mocked<DataSource>;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    dataSource = {
      query: jest.fn(),
    } as any;

    redisService = {
      isAvailable: jest.fn().mockReturnValue(false),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: DataSource, useValue: dataSource },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should return ok when database is healthy', async () => {
    dataSource.query.mockResolvedValue([{ 1: 1 }]);

    const result = await service.check();

    expect(result.status).toBe('ok');
    expect(result.services.database.status).toBe('healthy');
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('should return degraded when database is unhealthy', async () => {
    dataSource.query.mockRejectedValue(new Error('Connection failed'));

    const result = await service.check();

    expect(result.status).toBe('degraded');
    expect(result.services.database.status).toBe('unhealthy');
  });

  it('should include uptime and version', async () => {
    dataSource.query.mockResolvedValue([{ 1: 1 }]);

    const result = await service.check();

    expect(result.uptime).toBeGreaterThanOrEqual(0);
    expect(result.version).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });
});
