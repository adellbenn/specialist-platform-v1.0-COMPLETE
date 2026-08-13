import { createE2eApp, E2eApp, createSecurityFixture, createReportViaApi, http, bearer } from './e2e-harness';
import { ReportType } from '../src/modules/reports/report.entity';

describe('Reports Scope E2E Security', () => {
  let ctx: E2eApp;
  let fixture: Awaited<ReturnType<typeof createSecurityFixture>>;
  let reportA: any;
  let reportB: any;

  beforeAll(async () => {
    ctx = await createE2eApp();
    fixture = await createSecurityFixture(ctx);

    reportA = await createReportViaApi(ctx, fixture.tokens.specALogin.accessToken, {
      beneficiaryId: fixture.beneficiaries.beneficiaryA.id,
      type: ReportType.PROGRESS,
      title: `Report A ${Date.now()}`,
    });
    reportB = await createReportViaApi(ctx, fixture.tokens.specBLogin.accessToken, {
      beneficiaryId: fixture.beneficiaries.beneficiaryB.id,
      type: ReportType.INITIAL_ASSESSMENT,
      title: `Report B ${Date.now()}`,
    });
  }, 300000);

  afterAll(async () => {
    await ctx.close();
  });

  it('specialist can view own report', async () => {
    const res = await http(ctx, `/reports/${reportA.id}`, {
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(200);
    expect(res.body.data.id).toBe(reportA.id);
  });

  it('specialist cannot view another specialist report (IDOR)', async () => {
    const res = await http(ctx, `/reports/${reportB.id}`, {
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(403);
  });

  it('specialist list only contains own reports', async () => {
    const res = await http(ctx, '/reports', {
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(200);
    const ids = res.body.data.map((r: any) => r.id);
    expect(ids).toContain(reportA.id);
    expect(ids).not.toContain(reportB.id);
  });

  it('specialist can update own draft report', async () => {
    const res = await http(ctx, `/reports/${reportA.id}`, {
      method: 'PUT',
      headers: bearer(fixture.tokens.specALogin.accessToken),
      body: JSON.stringify({ title: 'Report A Updated' }),
    });
    expect(res.res.status).toBe(200);
    expect(res.body.data.title).toBe('Report A Updated');
  });

  it('specialist cannot update another specialist report', async () => {
    const res = await http(ctx, `/reports/${reportB.id}`, {
      method: 'PUT',
      headers: bearer(fixture.tokens.specALogin.accessToken),
      body: JSON.stringify({ title: 'Tampered' }),
    });
    expect(res.res.status).toBe(403);
  });

  it('specialist can submit own draft report', async () => {
    const res = await http(ctx, `/reports/${reportA.id}/submit`, {
      method: 'PATCH',
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(200);
    expect(res.body.data.status).toBe('submitted');
  });

  it('specialist cannot submit another specialist report', async () => {
    const res = await http(ctx, `/reports/${reportB.id}/submit`, {
      method: 'PATCH',
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(403);
  });

  it('specialist cannot approve reports (no REPORT_APPROVE)', async () => {
    const res = await http(ctx, `/reports/${reportB.id}/approve`, {
      method: 'PATCH',
      headers: bearer(fixture.tokens.specALogin.accessToken),
      body: JSON.stringify({ notes: 'nope' }),
    });
    expect(res.res.status).toBe(403);
  });

  it('receptionist cannot view reports (no report permission)', async () => {
    const res = await http(ctx, '/reports', {
      headers: bearer(fixture.tokens.receptionistLogin.accessToken),
    });
    expect(res.res.status).toBe(403);
  });

  it('receptionist cannot toggle report sharing', async () => {
    const res = await http(ctx, `/reports/${reportA.id}/toggle-share`, {
      method: 'PATCH',
      headers: bearer(fixture.tokens.receptionistLogin.accessToken),
    });
    expect(res.res.status).toBe(403);
  });

  it('accountant (disabled role) cannot view reports', async () => {
    const res = await http(ctx, '/reports', {
      headers: bearer(fixture.tokens.accountantLogin.accessToken),
    });
    expect(res.res.status).toBe(403);
  });

  it('accountant cannot approve reports', async () => {
    const res = await http(ctx, `/reports/${reportA.id}/approve`, {
      method: 'PATCH',
      headers: bearer(fixture.tokens.accountantLogin.accessToken),
      body: JSON.stringify({ notes: 'nope' }),
    });
    expect(res.res.status).toBe(403);
  });

  it('supervisor can view reports (REPORT_VIEW_ALL)', async () => {
    const res = await http(ctx, '/reports', {
      headers: bearer(fixture.tokens.supervisorLogin.accessToken),
    });
    expect(res.res.status).toBe(200);
  });

  it('supervisor can view a submitted report detail (REPORT_VIEW_OWN gate)', async () => {
    const res = await http(ctx, `/reports/${reportA.id}`, {
      headers: bearer(fixture.tokens.supervisorLogin.accessToken),
    });
    expect(res.res.status).toBe(200);
    expect(res.body.data.id).toBe(reportA.id);
  });

  it('supervisor cannot toggle sharing (no REPORT_UPDATE)', async () => {
    const res = await http(ctx, `/reports/${reportA.id}/toggle-share`, {
      method: 'PATCH',
      headers: bearer(fixture.tokens.supervisorLogin.accessToken),
    });
    expect(res.res.status).toBe(403);
  });

  it('supervisor can approve a submitted report', async () => {
    const res = await http(ctx, `/reports/${reportA.id}/approve`, {
      method: 'PATCH',
      headers: bearer(fixture.tokens.supervisorLogin.accessToken),
      body: JSON.stringify({ notes: 'approved in e2e' }),
    });
    expect(res.res.status).toBe(200);
    expect(res.body.data.status).toBe('approved');
  });

  it('specialist cannot archive another specialist report (IDOR)', async () => {
    const res = await http(ctx, `/reports/${reportB.id}`, {
      method: 'DELETE',
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(403);
  });

  it('specialist can archive own report', async () => {
    const res = await http(ctx, `/reports/${reportA.id}`, {
      method: 'DELETE',
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(200);
  });
});
