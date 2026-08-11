import { validationSchema, formatValidationError } from '../validation';

describe('Joi Validation Schema', () => {
  const validEnv = {
    NODE_ENV: 'development',
    JWT_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
  };

  describe('valid configuration', () => {
    it('should pass with minimal valid config', () => {
      const result = validationSchema.validate(validEnv, { abortEarly: true });
      expect(result.error).toBeUndefined();
    });

    it('should pass with full production config', () => {
      const prodEnv = {
        ...validEnv,
        NODE_ENV: 'production',
        DB_TYPE: 'postgres',
        DB_HOST: 'db.example.com',
        DB_PORT: 5432,
        DB_USERNAME: 'app_user',
        DB_PASSWORD: 'strong_password_here',
        DB_NAME: 'specialist_prod',
        DB_SYNC: 'false',
        SUPER_ADMIN_PASSWORD: 'admin_pass_123',
      };
      const result = validationSchema.validate(prodEnv, { abortEarly: true });
      expect(result.error).toBeUndefined();
    });

    it('should apply defaults for optional fields', () => {
      const result = validationSchema.validate(validEnv, { abortEarly: true });
      expect(result.value.APP_PORT).toBe(3001);
      expect(result.value.DB_TYPE).toBe('sqlite');
      expect(result.value.JWT_EXPIRES_IN).toBe('15m');
      expect(result.value.THROTTLE_LIMIT).toBe(60);
    });
  });

  describe('JWT_SECRET validation', () => {
    it('should reject missing JWT_SECRET', () => {
      const env = { JWT_REFRESH_SECRET: 'b'.repeat(32) };
      const result = validationSchema.validate(env, { abortEarly: false });
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('JWT_SECRET');
    });

    it('should reject JWT_SECRET shorter than 32 characters', () => {
      const env = { ...validEnv, JWT_SECRET: 'short' };
      const result = validationSchema.validate(env, { abortEarly: false });
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('32');
    });

    it('should reject missing JWT_REFRESH_SECRET', () => {
      const env = { JWT_SECRET: 'a'.repeat(32) };
      const result = validationSchema.validate(env, { abortEarly: false });
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('JWT_REFRESH_SECRET');
    });
  });

  describe('production-only validation', () => {
    it('should reject production without DB_PASSWORD', () => {
      const env = {
        ...validEnv,
        NODE_ENV: 'production',
        DB_TYPE: 'postgres',
      };
      const result = validationSchema.validate(env, { abortEarly: false });
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('DB_PASSWORD');
    });

    it('should reject production without SUPER_ADMIN_PASSWORD', () => {
      const env = {
        ...validEnv,
        NODE_ENV: 'production',
        DB_TYPE: 'postgres',
        DB_PASSWORD: 'secret',
      };
      const result = validationSchema.validate(env, { abortEarly: false });
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('SUPER_ADMIN_PASSWORD');
    });

    it('should NOT require DB_PASSWORD in development', () => {
      const env = { ...validEnv, NODE_ENV: 'development' };
      const result = validationSchema.validate(env, { abortEarly: true });
      expect(result.error).toBeUndefined();
    });
  });

  describe('NODE_ENV validation', () => {
    it('should reject invalid NODE_ENV', () => {
      const env = { ...validEnv, NODE_ENV: 'staging' };
      const result = validationSchema.validate(env, { abortEarly: false });
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('NODE_ENV');
    });

    it('should accept valid NODE_ENV values', () => {
      for (const envVal of ['development', 'test']) {
        const env = { ...validEnv, NODE_ENV: envVal };
        const result = validationSchema.validate(env, { abortEarly: true });
        expect(result.error).toBeUndefined();
      }
      // production requires DB_PASSWORD + SUPER_ADMIN_PASSWORD
      const prodEnv = {
        ...validEnv,
        NODE_ENV: 'production',
        DB_PASSWORD: 'secret',
        SUPER_ADMIN_PASSWORD: 'admin_pass',
      };
      const result = validationSchema.validate(prodEnv, { abortEarly: true });
      expect(result.error).toBeUndefined();
    });
  });

  describe('DB_SSL_REJECT_UNAUTHORIZED', () => {
    it('should default to true', () => {
      const result = validationSchema.validate(validEnv, { abortEarly: true });
      expect(result.value.DB_SSL_REJECT_UNAUTHORIZED).toBe('true');
    });

    it('should accept "false"', () => {
      const env = { ...validEnv, DB_SSL_REJECT_UNAUTHORIZED: 'false' };
      const result = validationSchema.validate(env, { abortEarly: true });
      expect(result.value.DB_SSL_REJECT_UNAUTHORIZED).toBe('false');
    });

    it('should reject non-boolean string', () => {
      const env = { ...validEnv, DB_SSL_REJECT_UNAUTHORIZED: 'maybe' };
      const result = validationSchema.validate(env, { abortEarly: false });
      expect(result.error).toBeDefined();
    });
  });

  describe('formatValidationError', () => {
    it('should format errors into a readable string', () => {
      const env = {};
      const result = validationSchema.validate(env, { abortEarly: false });
      expect(result.error).toBeDefined();

      const formatted = formatValidationError(result.error!);
      expect(formatted).toContain('JWT_SECRET');
      expect(formatted).toContain('╔════');
      expect(formatted).toContain('✗');
    });
  });
});
