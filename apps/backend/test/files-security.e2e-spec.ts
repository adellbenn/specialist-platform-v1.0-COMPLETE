import { createE2eApp, E2eApp, createSecurityFixture, uploadFileViaApi, http, bearer } from './e2e-harness';

describe('Files Security E2E', () => {
  let ctx: E2eApp;
  let fixture: Awaited<ReturnType<typeof createSecurityFixture>>;
  let fileA: any;
  let fileB: any;
  const maxFileSize = 1024;

  beforeAll(async () => {
    ctx = await createE2eApp();
    fixture = await createSecurityFixture(ctx);

    const uploadedA = await uploadFileViaApi(
      ctx,
      fixture.tokens.specALogin.accessToken,
      {
        entityType: 'beneficiary',
        entityId: fixture.beneficiaries.beneficiaryA.id,
        file: new Blob(['confidential-doc-a'], { type: 'text/plain' }),
        fileName: 'doc-a.txt',
      },
    );
    expect(uploadedA.res.status).toBe(201);
    fileA = uploadedA.body.data;

    const uploadedB = await uploadFileViaApi(
      ctx,
      fixture.tokens.specBLogin.accessToken,
      {
        entityType: 'beneficiary',
        entityId: fixture.beneficiaries.beneficiaryB.id,
        file: new Blob(['confidential-doc-b'], { type: 'text/plain' }),
        fileName: 'doc-b.txt',
      },
    );
    expect(uploadedB.res.status).toBe(201);
    fileB = uploadedB.body.data;
  }, 300000);

  afterAll(async () => {
    await ctx.close();
  });

  it('valid upload is accepted', async () => {
    const res = await uploadFileViaApi(ctx, fixture.tokens.specALogin.accessToken, {
      entityType: 'beneficiary',
      entityId: fixture.beneficiaries.beneficiaryA.id,
      file: new Blob(['hello'], { type: 'text/plain' }),
      fileName: 'ok.txt',
    });
    expect(res.res.status).toBe(201);
    expect(res.body.data.mimeType).toBe('text/plain');
    expect(res.body.data.originalName).toBe('ok.txt');
  });

  it('unauthenticated upload is rejected', async () => {
    const form = new FormData();
    form.append('file', new Blob(['x'], { type: 'text/plain' }), 'x.txt');
    const res = await http(
      ctx,
      `/files/upload?entityType=beneficiary&entityId=${fixture.beneficiaries.beneficiaryA.id}`,
      { method: 'POST', body: form },
    );
    expect(res.res.status).toBe(401);
  });

  it('oversized file is rejected (storage.maxFileSize = 1024)', async () => {
    const big = new Blob(['a'.repeat(maxFileSize + 512)], { type: 'text/plain' });
    const res = await uploadFileViaApi(ctx, fixture.tokens.specALogin.accessToken, {
      entityType: 'beneficiary',
      entityId: fixture.beneficiaries.beneficiaryA.id,
      file: big,
      fileName: 'big.txt',
    });
    expect(res.res.status).toBeGreaterThanOrEqual(400);
    expect(res.res.status).toBeLessThan(500);
  });

  it('invalid MIME type is rejected', async () => {
    const res = await uploadFileViaApi(ctx, fixture.tokens.specALogin.accessToken, {
      entityType: 'beneficiary',
      entityId: fixture.beneficiaries.beneficiaryA.id,
      file: new Blob(['MZ\x90\x00'], { type: 'application/octet-stream' }),
      fileName: 'malware.exe',
    });
    expect(res.res.status).toBe(400);
  });

  it('unauthenticated download is rejected', async () => {
    const res = await http(ctx, `/files/${fileA.id}/download`);
    expect(res.res.status).toBe(401);
  });

  it('authorized specialist can download own file', async () => {
    const res = await http(ctx, `/files/${fileA.id}/download`, {
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(200);
    expect(res.res.headers.get('content-type')).toContain('text/plain');
    expect(Number(res.res.headers.get('content-length'))).toBeGreaterThan(0);
    expect(res.text.length).toBeGreaterThan(0);
  });

  it('specialist cannot download file of another specialist (IDOR)', async () => {
    const res = await http(ctx, `/files/${fileB.id}/download`, {
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(403);
  });

  it('receptionist without FILE_VIEW cannot download files', async () => {
    const res = await http(ctx, `/files/${fileA.id}/download`, {
      headers: bearer(fixture.tokens.receptionistLogin.accessToken),
    });
    expect(res.res.status).toBe(403);
  });

  it('download of nonexistent file returns 404', async () => {
    const res = await http(ctx, `/files/00000000-0000-4000-8000-000000000000/download`, {
      headers: bearer(fixture.tokens.specALogin.accessToken),
    });
    expect(res.res.status).toBe(404);
  });
});
