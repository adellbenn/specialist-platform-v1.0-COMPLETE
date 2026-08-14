import * as Joi from 'joi';

/**
 * Joi validation schema for environment variables.
 *
 * Applied by ConfigModule.forRoot({ validationSchema }) BEFORE any module initializes.
 * If validation fails, the application refuses to start.
 *
 * Rules:
 * - NODE_ENV: required, one of development|test|production
 * - JWT secrets: required, minimum 32 characters
 * - DB: SQLite needs no credentials; PostgreSQL needs host/port/username/password/name
 * - Production-only: DB_PASSWORD and SUPER_ADMIN_PASSWORD are mandatory
 */
export const validationSchema = Joi.object({
  // ─── Application ──────────────────────────────────────────
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  APP_PORT: Joi.number().port().default(3001),
  APP_NAME: Joi.string().default('Specialist Platform'),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),

  // ─── JWT (always required) ────────────────────────────────
  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_SECRET must be at least 32 characters',
    'any.required': 'JWT_SECRET is required',
  }),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_REFRESH_SECRET must be at least 32 characters',
    'any.required': 'JWT_REFRESH_SECRET is required',
  }),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // ─── Database ─────────────────────────────────────────────
  DB_TYPE: Joi.string().valid('sqlite', 'postgres').default('sqlite'),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.required().messages({
      'any.required': 'DB_PASSWORD is required in production',
    }),
    otherwise: Joi.string().allow('', null).optional(),
  }),
  DB_NAME: Joi.string().default('specialist_platform'),
  DB_SYNC: Joi.string().valid('true', 'false').default('false'),
  DB_LOGGING: Joi.string().valid('true', 'false').default('false'),
  DB_POOL_SIZE: Joi.number().min(1).max(100).default(10),
  DB_IDLE_TIMEOUT_MS: Joi.number().positive().default(30000),
  DB_CONNECT_TIMEOUT_MS: Joi.number().positive().default(5000),
  DB_SSL: Joi.string().valid('true', 'false').default('true'),
  DB_SSL_REJECT_UNAUTHORIZED: Joi.string().valid('true', 'false').default('true'),

  // ─── Redis ────────────────────────────────────────────────
  REDIS_HOST: Joi.string().default('127.0.0.1'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_KEY_PREFIX: Joi.string().default('sp:'),

  // ─── Storage ──────────────────────────────────────────────
  STORAGE_TYPE: Joi.string().valid('local', 's3').default('local'),
  STORAGE_LOCAL_PATH: Joi.string().default('./uploads'),
  MAX_FILE_SIZE: Joi.number().positive().default(10485760),

  // ─── Rate Limiting ────────────────────────────────────────
  THROTTLE_TTL: Joi.number().positive().default(60),
  THROTTLE_LIMIT: Joi.number().positive().default(60),

  // ─── Production-only ──────────────────────────────────────
  SUPER_ADMIN_PASSWORD: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.required().messages({
      'any.required': 'SUPER_ADMIN_PASSWORD is required in production',
    }),
    otherwise: Joi.string().optional(),
  }),
  SUPER_ADMIN_EMAIL: Joi.string().email().optional(),
});

/**
 * Custom error formatting for Joi validation errors.
 * Produces clear, actionable error messages.
 */
export function formatValidationError(error: Joi.ValidationError): string {
  const lines = error.details.map((d) => `  ✗ ${d.message}`);
  return [
    '',
    '╔══════════════════════════════════════════╗',
    '║   FATAL: Environment Validation Failed   ║',
    '╚══════════════════════════════════════════╝',
    '',
    ...lines,
    '',
  ].join('\n');
}
