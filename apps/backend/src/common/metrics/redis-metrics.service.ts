import { Injectable, Logger } from '@nestjs/common';
import { redisOpsTotal, redisOperationDuration } from './metrics.module';

@Injectable()
export class RedisMetricsService {
  private readonly logger = new Logger(RedisMetricsService.name);

  recordHit(operation: string, durationMs: number): void {
    redisOpsTotal.labels(operation, 'hit').inc();
    redisOperationDuration.labels(operation).observe(durationMs);
  }

  recordMiss(operation: string, durationMs: number): void {
    redisOpsTotal.labels(operation, 'miss').inc();
    redisOperationDuration.labels(operation).observe(durationMs);
  }

  recordOperation(operation: string, durationMs: number, success: boolean): void {
    redisOpsTotal.labels(operation, success ? 'success' : 'error').inc();
    redisOperationDuration.labels(operation).observe(durationMs);
  }
}
