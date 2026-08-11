import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { dbQueryDuration, dbHealthStatus } from './metrics.module';

@Injectable()
export class DatabaseMetricsService {
  private readonly logger = new Logger(DatabaseMetricsService.name);
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    this.startHealthChecks();
  }

  private startHealthChecks() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const start = Date.now();
        await this.dataSource.query('SELECT 1');
        dbHealthStatus.set(1);
        dbQueryDuration.labels('health_check').observe(Date.now() - start);
      } catch {
        dbHealthStatus.set(0);
        this.logger.warn('Database health check failed');
      }
    }, 30_000);
  }

  recordQuery(operation: string, durationMs: number): void {
    dbQueryDuration.labels(operation).observe(durationMs);
  }

  onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}
