import { createE2eApp, E2eApp, createSecurityFixture, http, bearer } from './e2e-harness';

describe('Admin Routes Authorization E2E', () => {
  let ctx: E2eApp;
  let fixture: Awaited<ReturnType<typeof createSecurityFixture>>;

  beforeAll(async () => {
    ctx = await createE2eApp();
    fixture = await createSecurityFixture(ctx);
  }, 300000);

  afterAll(async () => {
    await ctx.close();
  });

  it('specialist cannot list permissions (no PERMISSION_VIEW)', async () => {
    const res = await http(ctx, '/permissions', {
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(403);
  });

  it('center manager can list permissions', async () => {
    const res = await http(ctx, '/permissions', {
      headers: bearer(fixture.tokens.managerLogin.accessToken),
    });
    expect(res.res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('specialist cannot list roles (no ROLE_VIEW)', async () => {
    const res = await http(ctx, '/permissions/roles', {
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(403);
  });

  it('center manager can list roles', async () => {
    const res = await http(ctx, '/permissions/roles', {
      headers: bearer(fixture.tokens.managerLogin.accessToken),
    });
    expect(res.res.status).toBe(200);
  });

  it('specialist cannot create roles (no ROLE_CREATE)', async () => {
    const res = await http(ctx, '/permissions/roles', {
      method: 'POST',
      headers: bearer(fixture.tokens.specALogin.accessToken),
      body: JSON.stringify({ name: `e2e-rogue-role-${Date.now()}` }),
    });
    expect(res.res.status).toBe(403);
  });

  it('center manager can create a role', async () => {
    const res = await http(ctx, '/permissions/roles', {
      method: 'POST',
      headers: bearer(fixture.tokens.managerLogin.accessToken),
      body: JSON.stringify({ name: `e2e-manager-role-${Date.now()}` }),
    });
    expect(res.res.status).toBe(201);
    expect(res.body.data.name).toContain('e2e-manager-role');
  });

  it('specialist cannot list users (no USER_VIEW)', async () => {
    const res = await http(ctx, '/users', {
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(403);
  });

  it('center manager can list users', async () => {
    const res = await http(ctx, '/users', {
      headers: bearer(fixture.tokens.managerLogin.accessToken),
    });
    expect(res.res.status).toBe(200);
  });

  it('specialist cannot view audit logs (no AUDIT_VIEW)', async () => {
    const res = await http(ctx, '/audit-logs', {
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(403);
  });

  it('center manager can view audit logs', async () => {
    const res = await http(ctx, '/audit-logs', {
      headers: bearer(fixture.tokens.managerLogin.accessToken),
    });
    expect(res.res.status).toBe(200);
  });

  it('specialist cannot set permission overrides (no USER_OVERRIDE)', async () => {
    const res = await http(ctx, '/permissions/users/override', {
      method: 'POST',
      headers: bearer(fixture.tokens.specALogin.accessToken),
      body: JSON.stringify({
        userId: fixture.users.specialistB.id,
        permissionId: '00000000-0000-4000-8000-000000000000',
        overrideType: 'granted',
      }),
    });
    expect(res.res.status).toBe(403);
  });

  it('center manager can set a permission override', async () => {
    const perms = await http(ctx, '/permissions', {
      headers: bearer(fixture.tokens.managerLogin.accessToken),
    });
    const permissionId = perms.body.data[0].id;
    const res = await http(ctx, '/permissions/users/override', {
      method: 'POST',
      headers: bearer(fixture.tokens.managerLogin.accessToken),
      body: JSON.stringify({
        userId: fixture.users.specialistB.id,
        permissionId,
        overrideType: 'denied',
      }),
    });
    expect(res.res.status).toBe(201);
  });

  it('specialist can access own analytics dashboard (DASHBOARD_STATS)', async () => {
    const res = await http(ctx, '/analytics/dashboard', {
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(200);
  });

  it('receptionist cannot access analytics trend (no ANALYTICS_VIEW)', async () => {
    const res = await http(ctx, '/analytics/appointments-trend', {
      headers: bearer(fixture.tokens.receptionistLogin.accessToken),
    });
    expect(res.res.status).toBe(403);
  });

  it('center manager can access analytics trend', async () => {
    const res = await http(ctx, '/analytics/appointments-trend', {
      headers: bearer(fixture.tokens.managerLogin.accessToken),
    });
    expect(res.res.status).toBe(200);
  });

  it('specialist can list own effective permissions (me endpoint)', async () => {
    const res = await http(ctx, '/permissions/users/me', {
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
