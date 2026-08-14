import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.APP_PORT ?? '3001', 10),
  name: process.env.APP_NAME || 'Specialist Platform',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  corsOrigins: (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}));

export const dbConfig = registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  name: process.env.DB_NAME || 'specialist_platform',
  sync: process.env.DB_SYNC === 'true',
  logging: process.env.DB_LOGGING === 'true',
  poolSize: parseInt(process.env.DB_POOL_SIZE ?? '10', 10),
  idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT_MS ?? '30000', 10),
  connectTimeoutMs: parseInt(process.env.DB_CONNECT_TIMEOUT_MS ?? '5000', 10),
  ssl: process.env.DB_SSL !== 'false',
  sslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD || '',
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'sp:',
}));

export const storageConfig = registerAs('storage', () => ({
  type: process.env.STORAGE_TYPE || 'local',
  localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE ?? '10485760', 10),
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_S3_BUCKET,
  },
}));
