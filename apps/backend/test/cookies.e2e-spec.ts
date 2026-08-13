import { createE2eApp, E2eApp, http, login, bearer } from './e2e-harness';

/**
 * Cookie security E2E.
 *
 * The backend transports auth tokens in the JSON response body and never sets
 * Set-Cookie headers (no HttpOnly/SameSite cookies to harden server-side).
 * These tests pin that actual architecture: no cookie-based session is created
 * by login/refresh, and protected routes require the explicit Authorization
 * header (i.e. a request with cookies alone cannot authenticate).
 */
describe('Cookie Behavior E2E Security', () => {
  let ctx: E2eApp;

  beforeAll(async () => {
    ctx = await createE2eApp();
  }, 60000);

  afterAll(async () => {
    await ctx.close();
  });

  it('login does not set any Set-Cookie header', async () => {
    const auth = await login(ctx);
    expect(auth.accessToken).toEqual(expect.any(String));

    const res = await fetch(`${ctx.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: process.env.SUPER_ADMIN_EMAIL, password: process.env.SUPER_ADMIN_PASSWORD }),
    });
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('refresh does not set any Set-Cookie header', async () => {
    const auth = await login(ctx);
    const res = await fetch(`${ctx.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('authenticated endpoint cannot be accessed without the Authorization header (no cookie session)', async () => {
    const auth = await login(ctx);
    expect(auth.accessToken).toEqual(expect.any(String));

    const noBearer = await http(ctx, '/auth/me');
    expect(noBearer.res.status).toBe(401);

    const withBearer = await http(ctx, '/auth/me', { headers: bearer(auth.accessToken) });
    expect(withBearer.res.status).toBe(200);
  });
});
