import { createE2eApp, E2eApp, createSecurityFixture, http, bearer } from './e2e-harness';
import { BeneficiaryStatus } from '../src/modules/beneficiaries/beneficiary.entity';

describe('Beneficiary Scope / IDOR E2E Security', () => {
  let ctx: E2eApp;
  let fixture: Awaited<ReturnType<typeof createSecurityFixture>>;

  beforeAll(async () => {
    ctx = await createE2eApp();
    fixture = await createSecurityFixture(ctx);
  }, 300000);

  afterAll(async () => {
    await ctx.close();
  });

  it('specialist can view assigned beneficiary', async () => {
    const res = await http(ctx, `/beneficiaries/${fixture.beneficiaries.beneficiaryA.id}`, {
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(200);
    expect(res.body.data.id).toBe(fixture.beneficiaries.beneficiaryA.id);
  });

  it('specialist cannot view beneficiary assigned to another specialist (404 info-hiding)', async () => {
    const res = await http(ctx, `/beneficiaries/${fixture.beneficiaries.beneficiaryB.id}`, {
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(404);
  });

  it('specialist cannot update beneficiary assigned to another specialist (404 info-hiding)', async () => {
    const res = await http(ctx, `/beneficiaries/${fixture.beneficiaries.beneficiaryB.id}`, {
      method: 'PUT',
      headers: bearer(fixture.tokens.specALogin.accessToken),
      body: JSON.stringify({ phone: '0555555555' }),
    });
    expect(res.res.status).toBe(404);
  });

  it('specialist cannot change status of beneficiary assigned to another specialist', async () => {
    const res = await http(ctx, `/beneficiaries/${fixture.beneficiaries.beneficiaryB.id}/status`, {
      method: 'PATCH',
      headers: bearer(fixture.tokens.specALogin.accessToken),
      body: JSON.stringify({ status: BeneficiaryStatus.INACTIVE }),
    });
    expect(res.res.status).toBe(403);
  });

  it('specialist cannot archive beneficiary assigned to another specialist', async () => {
    const res = await http(ctx, `/beneficiaries/${fixture.beneficiaries.beneficiaryB.id}`, {
      method: 'DELETE',
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(403);
  });
});
