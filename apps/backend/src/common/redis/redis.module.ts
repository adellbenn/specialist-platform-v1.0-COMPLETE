import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisMetricsService } from '@common/metrics/redis-metrics.service';

@Global()
@Module({
  providers: [RedisService, RedisMetricsService],
  exports: [RedisService, RedisMetricsService],
})
export class RedisModule {}
