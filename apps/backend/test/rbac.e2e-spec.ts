import { createE2eApp, E2eApp, createSecurityFixture, http, bearer } from './e2e-harness';
import { UserRole } from '../src/modules/users/user.entity';

describe('RBAC Role Escalation E2E Security', () => {
  let ctx: E2eApp;
  let fixture: Awaited<ReturnType<typeof createSecurityFixture>>;

  beforeAll(async () => {
    ctx = await createE2eApp();
    fixture = await createSecurityFixture(ctx);
  }, 300000);

  afterAll(async () => {
    await ctx.close();
  });

  it('lower privileged user cannot create SUPER_ADMIN', async () => {
    const res = await http(ctx, '/users', {
      method: 'POST',
      headers: bearer(fixture.tokens.specALogin.accessToken),
      body: JSON.stringify({
        email: `e2e-escalate-${Date.now()}@example.com`,
        password: fixture.password,
        firstName: 'Escalate',
        lastName: 'Attempt',
        role: UserRole.SUPER_ADMIN,
      }),
    });
    expect(res.res.status).toBe(403);
  });

  it('user cannot update own role to a higher role', async () => {
    const res = await http(ctx, `/users/${fixture.users.specialistA.id}`, {
      method: 'PUT',
      headers: bearer(fixture.tokens.specALogin.accessToken),
      body: JSON.stringify({ role: UserRole.CENTER_MANAGER }),
    });
    expect(res.res.status).toBe(403);
  });

  it('lower-ranked user cannot modify a higher-ranked user', async () => {
    const res = await http(ctx, `/users/${fixture.users.centerManager.id}`, {
      method: 'PUT',
      headers: bearer(fixture.tokens.specALogin.accessToken),
      body: JSON.stringify({ firstName: 'Tampered' }),
    });
    expect(res.res.status).toBe(403);
  });

  it('center manager can update lower-ranked user in same tenant', async () => {
    const res = await http(ctx, `/users/${fixture.users.specialistA.id}`, {
      method: 'PUT',
      headers: bearer(fixture.tokens.managerLogin.accessToken),
      body: JSON.stringify({ firstName: 'UpdatedSpec' }),
    });
    expect(res.res.status).toBe(200);
    expect(res.body.data.firstName).toBe('UpdatedSpec');
  });

  it('seeded specialist role carries the module permissions guards rely on (regression: plural/singular key mismatch)', async () => {
    const res = await http(ctx, '/permissions/users/me', {
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(200);
    const perms: string[] = res.body.data ?? [];
    for (const required of [
      'beneficiary:create',
      'beneficiary:view_own',
      'report:create',
      'session:create',
      'appointment:create',
    ]) {
      expect(perms).toContain(required);
    }
  });
});
