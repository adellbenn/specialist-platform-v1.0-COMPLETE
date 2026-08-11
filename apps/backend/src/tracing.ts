/**
 * OpenTelemetry Tracing — MUST be imported before all other imports.
 *
 * Usage in main.ts:
 *   import './tracing';
 *   // ... rest of imports
 *
 * Environment variables:
 *   OTEL_SERVICE_NAME          — service name (default: specialist-platform-backend)
 *   OTEL_EXPORTER_OTLP_ENDPOINT — OTLP collector endpoint (default: http://localhost:4317)
 *   OTEL_TRACES_EXPORTER       — exporter type: otlp | console | none (default: otlp)
 *   OTEL_METRICS_EXPORTER      — exporter type: otlp | console | none (default: otlp)
 */

// Load .env early since this file runs before NestJS ConfigModule
import * as path from 'path';
import * as fs from 'fs';
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { TypeormInstrumentation } from '@opentelemetry/instrumentation-typeorm';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// Enable OTel diagnostics in development
const nodeEnv = process.env.NODE_ENV || 'development';
if (nodeEnv !== 'production') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
}

const serviceName = process.env.OTEL_SERVICE_NAME || 'specialist-platform-backend';
const serviceVersion = process.env.npm_package_version || '1.0.0';
const collectorEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317';
const tracesExporterType = process.env.OTEL_TRACES_EXPORTER || 'otlp';
const metricsExporterType = process.env.OTEL_METRICS_EXPORTER || 'otlp';

// ─── Resource ──────────────────────────────────────────────

const resource = defaultResource().merge(
  resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
    'deployment.environment': nodeEnv,
  }),
);

// ─── Trace Exporter ────────────────────────────────────────

function createTraceExporter() {
  switch (tracesExporterType) {
    case 'console':
      return new ConsoleSpanExporter();
    case 'none':
      return undefined;
    case 'otlp':
    default:
      return new OTLPTraceExporter({
        url: collectorEndpoint,
      });
  }
}

// ─── Metric Reader ─────────────────────────────────────────

function createMetricReader() {
  switch (metricsExporterType) {
    case 'console':
      return undefined;
    case 'none':
      return undefined;
    case 'otlp':
    default: {
      const exporter = new OTLPMetricExporter({
        url: collectorEndpoint,
      });
      return new PeriodicExportingMetricReader({
        exporter,
        exportIntervalMillis: 15_000,
      });
    }
  }
}

// ─── Instrumentations ──────────────────────────────────────

const instrumentations = [
  new HttpInstrumentation({
    ignoreIncomingRequestHook: (req) => {
      const url = req.url || '';
      return url.includes('/health') || url.includes('/metrics');
    },
  }),
  new NestInstrumentation(),
  new IORedisInstrumentation(),
  new TypeormInstrumentation(),
  new PgInstrumentation(),
];

// ─── SDK Initialization ────────────────────────────────────

const traceExporter = createTraceExporter();
const metricReader = createMetricReader();

const sdkConfig: ConstructorParameters<typeof NodeSDK>[0] = {
  resource,
  traceExporter,
  instrumentations,
};

if (metricReader) {
  (sdkConfig as any).metricReaders = [metricReader];
}

const sdk = new NodeSDK(sdkConfig);

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('[OTel] Tracing shut down'))
    .catch((err) => console.error('[OTel] Error shutting down', err))
    .finally(() => process.exit(0));
});

// Start SDK — this must run before any other imports
sdk.start();

console.log(
  `[OTel] Tracing initialized — service: ${serviceName}, exporter: ${tracesExporterType}, endpoint: ${collectorEndpoint}`,
);

export { sdk };
