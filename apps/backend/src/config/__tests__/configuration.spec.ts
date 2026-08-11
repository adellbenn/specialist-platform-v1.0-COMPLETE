import { appConfig, dbConfig, jwtConfig, redisConfig, storageConfig } from '../configuration';

describe('configuration factories', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('appConfig', () => {
    it('returns default values when env not set', () => {
      delete process.env.NODE_ENV;
      delete process.env.APP_PORT;
      delete process.env.APP_NAME;
      delete process.env.FRONTEND_URL;

      const cfg = appConfig();
      expect(cfg.nodeEnv).toBe('development');
      expect(cfg.port).toBe(3001);
      expect(cfg.name).toBe('Specialist Platform');
      expect(cfg.frontendUrl).toBe('http://localhost:3000');
    });

    it('uses env values when set', () => {
      process.env.NODE_ENV = 'production';
      process.env.APP_PORT = '8080';
      process.env.APP_NAME = 'My App';
      process.env.FRONTEND_URL = 'https://app.example.com';

      const cfg = appConfig();
      expect(cfg.nodeEnv).toBe('production');
      expect(cfg.port).toBe(8080);
      expect(cfg.name).toBe('My App');
      expect(cfg.frontendUrl).toBe('https://app.example.com');
    });
  });

  describe('dbConfig', () => {
    it('returns default values', () => {
      const cfg = dbConfig();
      expect(cfg.host).toBe('localhost');
      expect(cfg.port).toBe(5432);
      expect(cfg.username).toBe('postgres');
      expect(cfg.name).toBe('specialist_platform');
      expect(cfg.sync).toBe(false);
      expect(cfg.logging).toBe(false);
      expect(cfg.poolSize).toBe(10);
      expect(cfg.sslRejectUnauthorized).toBe(true);
    });

    it('reads env values', () => {
      process.env.DB_HOST = 'db.example.com';
      process.env.DB_PORT = '5433';
      process.env.DB_SYNC = 'true';
      process.env.DB_LOGGING = 'true';
      process.env.DB_SSL_REJECT_UNAUTHORIZED = 'false';
      process.env.DB_POOL_SIZE = '20';

      const cfg = dbConfig();
      expect(cfg.host).toBe('db.example.com');
      expect(cfg.port).toBe(5433);
      expect(cfg.sync).toBe(true);
      expect(cfg.logging).toBe(true);
      expect(cfg.sslRejectUnauthorized).toBe(false);
      expect(cfg.poolSize).toBe(20);
    });

    it('password can be undefined', () => {
      delete process.env.DB_PASSWORD;
      const cfg = dbConfig();
      expect(cfg.password).toBeUndefined();
    });
  });

  describe('jwtConfig', () => {
    it('returns default values', () => {
      const cfg = jwtConfig();
      expect(cfg.expiresIn).toBe('15m');
      expect(cfg.refreshExpiresIn).toBe('7d');
    });

    it('reads env values', () => {
      process.env.JWT_SECRET = 'my-secret';
      process.env.JWT_EXPIRES_IN = '1h';
      process.env.JWT_REFRESH_SECRET = 'refresh-secret';
      process.env.JWT_REFRESH_EXPIRES_IN = '30d';

      const cfg = jwtConfig();
      expect(cfg.secret).toBe('my-secret');
      expect(cfg.expiresIn).toBe('1h');
      expect(cfg.refreshSecret).toBe('refresh-secret');
      expect(cfg.refreshExpiresIn).toBe('30d');
    });
  });

  describe('redisConfig', () => {
    it('returns default values', () => {
      const cfg = redisConfig();
      expect(cfg.host).toBe('127.0.0.1');
      expect(cfg.port).toBe(6379);
      expect(cfg.keyPrefix).toBe('sp:');
    });

    it('reads env values', () => {
      process.env.REDIS_HOST = 'redis.example.com';
      process.env.REDIS_PORT = '6380';
      process.env.REDIS_PASSWORD = 'pass';
      process.env.REDIS_KEY_PREFIX = 'myapp:';

      const cfg = redisConfig();
      expect(cfg.host).toBe('redis.example.com');
      expect(cfg.port).toBe(6380);
      expect(cfg.password).toBe('pass');
      expect(cfg.keyPrefix).toBe('myapp:');
    });
  });

  describe('storageConfig', () => {
    it('returns default values', () => {
      const cfg = storageConfig();
      expect(cfg.type).toBe('local');
      expect(cfg.localPath).toBe('./uploads');
      expect(cfg.maxFileSize).toBe(10485760);
    });

    it('reads env values', () => {
      process.env.STORAGE_TYPE = 's3';
      process.env.STORAGE_LOCAL_PATH = '/data/uploads';
      process.env.MAX_FILE_SIZE = '5242880';
      process.env.AWS_REGION = 'us-east-1';

      const cfg = storageConfig();
      expect(cfg.type).toBe('s3');
      expect(cfg.localPath).toBe('/data/uploads');
      expect(cfg.maxFileSize).toBe(5242880);
      expect(cfg.aws.region).toBe('us-east-1');
    });

    it('AWS values can be undefined', () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      const cfg = storageConfig();
      expect(cfg.aws.accessKeyId).toBeUndefined();
      expect(cfg.aws.secretAccessKey).toBeUndefined();
    });
  });
});
