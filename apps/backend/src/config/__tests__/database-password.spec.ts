import { validationSchema } from '../validation';

/**
 * Production DB password requirements.
 *
 * SQLite needs no credentials, so production tests use a real database
 * (postgres) where DB_PASSWORD is mandatory. Dummy values only.
 */
describe('DB_PASSWORD production requirements', () => {
  const baseEnv = {
    NODE_ENV: 'production',
    DB_TYPE: 'postgres',
    DB_HOST: 'db.example.com',
    DB_PORT: 5432,
    DB_USERNAME: 'app_user',
    DB_NAME: 'specialist_prod',
    JWT_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    SUPER_ADMIN_PASSWORD: 'admin_pass_123',
  };

  it('rejects a missing DB_PASSWORD in production', () => {
    const result = validationSchema.validate(baseEnv, { abortEarly: false });
    expect(result.error).toBeDefined();
    expect(result.error!.message).toContain('DB_PASSWORD');
  });

  it('rejects an empty DB_PASSWORD in production', () => {
    const result = validationSchema.validate(
      { ...baseEnv, DB_PASSWORD: '' },
      { abortEarly: false },
    );
    expect(result.error).toBeDefined();
    expect(result.error!.message).toContain('DB_PASSWORD');
  });

  it('rejects a DB_PASSWORD shorter than 16 characters in production', () => {
    const result = validationSchema.validate(
      { ...baseEnv, DB_PASSWORD: 'a'.repeat(15) },
      { abortEarly: false },
    );
    expect(result.error).toBeDefined();
    expect(result.error!.message).toContain('DB_PASSWORD');
  });

  it('accepts a strong DB_PASSWORD (16+ characters) in production', () => {
    const result = validationSchema.validate(
      { ...baseEnv, DB_PASSWORD: 'a'.repeat(16) },
      { abortEarly: false },
    );
    expect(result.error).toBeUndefined();
    expect(result.value.DB_PASSWORD).toBe('a'.repeat(16));
  });

  it('allows a missing DB_PASSWORD in development', () => {
    const result = validationSchema.validate(
      {
        NODE_ENV: 'development',
        JWT_SECRET: 'a'.repeat(32),
        JWT_REFRESH_SECRET: 'b'.repeat(32),
      },
      { abortEarly: false },
    );
    expect(result.error).toBeUndefined();
  });
});
