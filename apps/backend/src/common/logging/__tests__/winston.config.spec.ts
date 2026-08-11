import { createWinstonOptions } from '../winston.config';

describe('createWinstonOptions', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('returns console-only transport in development', () => {
    process.env.NODE_ENV = 'development';
    const opts = createWinstonOptions();
    expect(opts.transports).toHaveLength(1);
    expect(opts.transports[0].constructor.name).toBe('Console');
  });

  it('uses debug level in development', () => {
    process.env.NODE_ENV = 'development';
    const opts = createWinstonOptions();
    expect((opts.transports[0] as any).level).toBe('debug');
  });

  it('returns console + file transports in production', () => {
    process.env.NODE_ENV = 'production';
    const opts = createWinstonOptions();
    expect(opts.transports.length).toBe(3);
  });

  it('uses info level in production console', () => {
    process.env.NODE_ENV = 'production';
    const opts = createWinstonOptions();
    expect((opts.transports[0] as any).level).toBe('info');
  });

  it('has error.log file transport in production', () => {
    process.env.NODE_ENV = 'production';
    const opts = createWinstonOptions();
    const fileTransports = opts.transports.filter(
      (t: any) => t.constructor.name === 'File',
    );
    expect(fileTransports).toHaveLength(2);
  });

  it('returns format object', () => {
    process.env.NODE_ENV = 'development';
    const opts = createWinstonOptions();
    expect(opts.format).toBeDefined();
  });

  it('defaults to development when NODE_ENV not set', () => {
    delete process.env.NODE_ENV;
    const opts = createWinstonOptions();
    expect(opts.transports).toHaveLength(1);
  });
});
