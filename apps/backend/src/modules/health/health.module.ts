import { Controller, Get, Module, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { RedisService } from '@common/redis/redis.service';
import { dbHealthStatus } from '@common/metrics/metrics.module';

// ════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private redisService: RedisService,
  ) {}

  async check() {
    const dbStart = Date.now();
    let dbStatus = 'healthy';
    let dbLatency = 0;

    try {
      await this.dataSource.query('SELECT 1');
      dbLatency = Date.now() - dbStart;
      dbHealthStatus.set(1);
    } catch {
      dbStatus = 'unhealthy';
      dbHealthStatus.set(0);
    }

    const redisAvailable = this.redisService.isAvailable();

    const memoryUsed = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsed.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsed.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memoryUsed.rss / 1024 / 1024);

    const overallStatus =
      dbStatus === 'healthy' ? 'ok' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version ?? '1.0.0',
      services: {
        database: {
          status: dbStatus,
          latency: `${dbLatency}ms`,
        },
        redis: {
          status: redisAvailable ? 'healthy' : 'unavailable',
          connected: redisAvailable,
        },
        memory: {
          heapUsed: `${heapUsedMB}MB`,
          heapTotal: `${heapTotalMB}MB`,
          rss: `${rssMB}MB`,
        },
        node: {
          version: process.version,
          pid: process.pid,
        },
      },
    };
  }
}

// ════════════════════════════════════════════
// CONTROLLER
// ════════════════════════════════════════════

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health Check' })
  async check() {
    return this.healthService.check();
  }
}

// ════════════════════════════════════════════
// MODULE
// ════════════════════════════════════════════

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
