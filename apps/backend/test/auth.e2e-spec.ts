import { createE2eApp, E2eApp, http, login, bearer } from './e2e-harness';

describe('Authentication E2E Security', () => {
  let ctx: E2eApp;

  beforeAll(async () => {
    ctx = await createE2eApp();
  }, 60000);

  afterAll(async () => {
    await ctx.close();
  });

  it('valid credentials authenticate and allow protected request', async () => {
    const auth = await login(ctx);
    expect(auth.accessToken).toEqual(expect.any(String));
    expect(auth.refreshToken).toEqual(expect.any(String));
    expect(auth.user.email).toBe(process.env.SUPER_ADMIN_EMAIL);
    expect(auth.user.passwordHash).toBeUndefined();

    const me = await http(ctx, '/auth/me', { headers: bearer(auth.accessToken) });
    expect(me.res.status).toBe(200);
    expect(me.body.data.email).toBe(process.env.SUPER_ADMIN_EMAIL);
  });

  it('invalid password is rejected', async () => {
    const result = await http(ctx, '/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: process.env.SUPER_ADMIN_EMAIL, password: 'WrongPass123!' }),
    });
    expect(result.res.status).toBe(401);
  });

  it('nonexistent user is rejected without obvious user enumeration', async () => {
    const badPassword = await http(ctx, '/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: process.env.SUPER_ADMIN_EMAIL, password: 'WrongPass123!' }),
    });
    const nonexistent = await http(ctx, '/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'missing@example.com', password: 'WrongPass123!' }),
    });
    expect(nonexistent.res.status).toBe(401);
    expect(nonexistent.body.message).toEqual(badPassword.body.message);
  });

  it('protected endpoint rejects missing auth and accepts valid auth', async () => {
    const missing = await http(ctx, '/auth/me');
    expect(missing.res.status).toBe(401);

    const auth = await login(ctx);
    const ok = await http(ctx, '/auth/me', { headers: bearer(auth.accessToken) });
    expect(ok.res.status).toBe(200);
  });

  it('refresh accepts a valid refresh token and rejects invalid refresh token', async () => {
    const auth = await login(ctx);
    const refreshed = await http(ctx, '/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    });
    expect(refreshed.res.status).toBe(200);
    expect(refreshed.body.data.accessToken).toEqual(expect.any(String));

    const invalid = await http(ctx, '/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: 'not-a-jwt' }),
    });
    expect(invalid.res.status).toBe(401);
  });
});
