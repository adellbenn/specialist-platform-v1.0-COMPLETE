import { Module, Global, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { Public } from '@common/decorators/keys';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

// ════════════════════════════════════════════════════════════
// SHARED REGISTRY — all services share this singleton
// ════════════════════════════════════════════════════════════

export const metricsRegistry = new Registry();

collectDefaultMetrics({
  register: metricsRegistry,
  prefix: 'sp_',
  labels: { app: 'specialist-platform' },
});

// ─── HTTP Metrics ──────────────────────────────────────────

export const httpRequestDuration = new Histogram({
  name: 'sp_http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  registers: [metricsRegistry],
});

export const httpRequestTotal = new Counter({
  name: 'sp_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});

export const httpErrorsTotal = new Counter({
  name: 'sp_http_errors_total',
  help: 'Total number of HTTP errors (4xx + 5xx)',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});

// ─── Redis Metrics ─────────────────────────────────────────

export const redisOpsTotal = new Counter({
  name: 'sp_redis_operations_total',
  help: 'Total Redis operations',
  labelNames: ['operation', 'result'],
  registers: [metricsRegistry],
});

export const redisOperationDuration = new Histogram({
  name: 'sp_redis_operation_duration_ms',
  help: 'Redis operation duration in milliseconds',
  labelNames: ['operation'],
  buckets: [1, 2, 5, 10, 25, 50, 100, 250],
  registers: [metricsRegistry],
});

// ─── Database Metrics ──────────────────────────────────────

export const dbQueryDuration = new Histogram({
  name: 'sp_db_query_duration_ms',
  help: 'Database query duration in milliseconds',
  labelNames: ['operation'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500],
  registers: [metricsRegistry],
});

export const dbHealthStatus = new Gauge({
  name: 'sp_db_health_status',
  help: 'Database health status (1 = healthy, 0 = unhealthy)',
  registers: [metricsRegistry],
});

// ─── Application Metrics ───────────────────────────────────

export const appBeneficiariesTotal = new Gauge({
  name: 'sp_app_beneficiaries_total',
  help: 'Total beneficiaries by status',
  labelNames: ['status'],
  registers: [metricsRegistry],
});

export const appAppointmentsToday = new Gauge({
  name: 'sp_app_appointments_today',
  help: 'Today\'s appointments count',
  labelNames: ['status'],
  registers: [metricsRegistry],
});

export const appSessionsTotal = new Gauge({
  name: 'sp_app_sessions_total',
  help: 'Total sessions count',
  registers: [metricsRegistry],
});

export const appRevenueTotal = new Gauge({
  name: 'sp_app_revenue_total',
  help: 'Total revenue in base currency unit',
  registers: [metricsRegistry],
});

// ════════════════════════════════════════════════════════════
// CONTROLLER — /metrics endpoint for Prometheus scrape
// ════════════════════════════════════════════════════════════

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  async getMetrics(@Res() res: Response) {
    res.setHeader('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  }
}

// ════════════════════════════════════════════════════════════
// MODULE
// ════════════════════════════════════════════════════════════

@Global()
@Module({
  controllers: [MetricsController],
  providers: [],
  exports: [],
})
export class MetricsModule implements OnModuleDestroy {
  async onModuleDestroy() {
    await metricsRegistry.clear();
  }
}
