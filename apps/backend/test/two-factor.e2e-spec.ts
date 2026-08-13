import * as speakeasy from 'speakeasy';
import { createE2eApp, E2eApp, http, login, bearer } from './e2e-harness';

describe('Two-Factor Authentication E2E Security', () => {
  let ctx: E2eApp;
  let token: string;

  beforeEach(async () => {
    ctx = await createE2eApp();
    token = (await login(ctx)).accessToken;
  }, 60000);

  afterEach(async () => {
    await ctx.close();
  });

  it('status starts disabled', async () => {
    const status = await http(ctx, '/auth/2fa/status', { headers: bearer(token) });
    expect(status.res.status).toBe(200);
    expect(status.body.data.enabled).toBe(false);
  });

  it('generate returns setup data without user secrets', async () => {
    const generated = await http(ctx, '/auth/2fa/generate', { method: 'POST', headers: bearer(token) });
    expect(generated.res.status).toBe(201);
    expect(generated.body.data.secret).toEqual(expect.any(String));
    expect(generated.body.data.otpauthUrl).toContain('otpauth://totp/');
    expect(generated.body.data.backupCodes).toHaveLength(10);
    expect(generated.body.data.twoFactorSecret).toBeUndefined();
  });

  it('invalid verify code is rejected and 2FA remains disabled', async () => {
    await http(ctx, '/auth/2fa/generate', { method: 'POST', headers: bearer(token) });
    const invalid = await http(ctx, '/auth/2fa/verify', {
      method: 'POST',
      headers: bearer(token),
      body: JSON.stringify({ code: '000000' }),
    });
    expect(invalid.res.status).toBe(400);
    const status = await http(ctx, '/auth/2fa/status', { headers: bearer(token) });
    expect(status.body.data.enabled).toBe(false);
  });

  it('generate + real TOTP verify enables 2FA', async () => {
    const generated = await http(ctx, '/auth/2fa/generate', { method: 'POST', headers: bearer(token) });
    const code = speakeasy.totp({ secret: generated.body.data.secret, encoding: 'base32' });
    const verify = await http(ctx, '/auth/2fa/verify', {
      method: 'POST',
      headers: bearer(token),
      body: JSON.stringify({ code }),
    });
    expect(verify.res.status).toBe(200);
    const status = await http(ctx, '/auth/2fa/status', { headers: bearer(token) });
    expect(status.body.data.enabled).toBe(true);
  });

  it('disable rejects invalid password and invalid code, then succeeds with valid credentials', async () => {
    const generated = await http(ctx, '/auth/2fa/generate', { method: 'POST', headers: bearer(token) });
    const enableCode = speakeasy.totp({ secret: generated.body.data.secret, encoding: 'base32' });
    await http(ctx, '/auth/2fa/verify', {
      method: 'POST',
      headers: bearer(token),
      body: JSON.stringify({ code: enableCode }),
    });

    const validCode = speakeasy.totp({ secret: generated.body.data.secret, encoding: 'base32' });
    const badPassword = await http(ctx, '/auth/2fa/disable', {
      method: 'POST',
      headers: bearer(token),
      body: JSON.stringify({ password: 'WrongPass123!', code: validCode }),
    });
    expect(badPassword.res.status).toBe(401);

    const badCode = await http(ctx, '/auth/2fa/disable', {
      method: 'POST',
      headers: bearer(token),
      body: JSON.stringify({ password: process.env.SUPER_ADMIN_PASSWORD, code: '000000' }),
    });
    expect(badCode.res.status).toBe(400);

    const disableCode = speakeasy.totp({ secret: generated.body.data.secret, encoding: 'base32' });
    const ok = await http(ctx, '/auth/2fa/disable', {
      method: 'POST',
      headers: bearer(token),
      body: JSON.stringify({ password: process.env.SUPER_ADMIN_PASSWORD, code: disableCode }),
    });
    expect(ok.res.status).toBe(200);

    const status = await http(ctx, '/auth/2fa/status', { headers: bearer(token) });
    expect(status.body.data.enabled).toBe(false);
  });

  it('repeated invalid verify attempts are throttled', async () => {
    const local = await createE2eApp({
      throttlers: [
        { name: 'default', ttl: 300000, limit: 100000 },
        { name: 'strict', ttl: 60000, limit: 3 },
        { name: 'relaxed', ttl: 60000, limit: 200 },
      ],
    });
    try {
      const localAuth = await login(local);
      await http(local, '/auth/2fa/generate', { method: 'POST', headers: bearer(localAuth.accessToken) });
      const statuses: number[] = [];
      for (let i = 0; i < 7; i += 1) {
        const result = await http(local, '/auth/2fa/verify', {
          method: 'POST',
          headers: bearer(localAuth.accessToken),
          body: JSON.stringify({ code: `99999${i}` }),
        });
        statuses.push(result.res.status);
      }
      expect(statuses).toContain(429);
    } finally {
      await local.close();
    }
  }, 60000);
});
