import { firstValueFrom, of, throwError } from 'rxjs';
import { UnauthorizedException } from '@nestjs/common';
import { PATH_METADATA, HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { AuditInterceptor } from '../audit.interceptor';
import { AuditAction } from '@modules/audit-log/audit-log.entity';

interface Options {
  controllerPath?: string;
  isPublic?: boolean;
  httpCode?: number;
  method?: string;
  routePath?: string;
}

function makeReflector(opts: Options = {}) {
  return {
    get: jest.fn((key: string) => {
      if (key === PATH_METADATA) return opts.controllerPath;
      if (key === HTTP_CODE_METADATA) return opts.httpCode;
      return undefined;
    }),
    getAllAndOverride: jest.fn(() => opts.isPublic ?? false),
  } as any;
}

function makeContext(handler: Function, req: any) {
  const cls = class TestController {};
  return {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => ({}) }),
    getHandler: () => handler,
    getClass: () => cls,
  } as any;
}

function makeReq(opts: Options = {}) {
  return {
    method: opts.method ?? 'POST',
    params: {},
    headers: {},
    baseUrl: `/${opts.controllerPath ?? 'beneficiaries'}`,
    route: { path: opts.routePath ?? '/' },
    path: '/',
    originalUrl: '/',
    ip: '127.0.0.1',
  } as any;
}

function intercept(
  audit: any,
  handler: Function,
  req: any,
  next: any,
  opts: Options = {},
) {
  const interceptor = new AuditInterceptor(audit, makeReflector(opts));
  const context = makeContext(handler, req);
  return interceptor.intercept(context, next);
}

describe('AuditInterceptor', () => {
  let audit: { log: jest.Mock };

  beforeEach(() => {
    audit = { log: jest.fn().mockResolvedValue(undefined) };
  });

  const created = function create() {};

  it('logs a successful POST as CREATE with actor, ip and entity id', async () => {
    const req = makeReq({ method: 'POST', controllerPath: 'beneficiaries' });
    req.user = { id: 'u1', role: 'specialist', tenantId: 't1' };
    const next = { handle: () => of({ id: 'b1' }) };

    await firstValueFrom(intercept(audit, created, req, next, { controllerPath: 'beneficiaries' }));

    expect(audit.log).toHaveBeenCalledTimes(1);
    const record = audit.log.mock.calls[0][0];
    expect(record.action).toBe(AuditAction.CREATE);
    expect(record.entityType).toBe('beneficiaries');
    expect(record.entityId).toBe('b1');
    expect(record.userId).toBe('u1');
    expect(record.tenantId).toBe('t1');
    expect(record.ipAddress).toBe('127.0.0.1');
    expect(record.description).toContain('POST');
    expect(record.description).toContain('role=specialist');
  });

  it('does not log GET requests', async () => {
    const findAll = function findAll() {};
    const req = makeReq({ method: 'GET', controllerPath: 'beneficiaries' });
    const next = { handle: () => of([{ id: 'b1' }]) };

    await firstValueFrom(intercept(audit, findAll, req, next, { controllerPath: 'beneficiaries' }));

    expect(audit.log).not.toHaveBeenCalled();
  });

  it('never fails the request when the audit write fails', async () => {
    audit.log.mockRejectedValue(new Error('db down'));
    const req = makeReq({ method: 'POST', controllerPath: 'beneficiaries' });
    const payload = { id: 'b1' };
    const next = { handle: () => of(payload) };

    const result = await firstValueFrom(
      intercept(audit, created, req, next, { controllerPath: 'beneficiaries' }),
    );

    expect(result).toEqual(payload);
    expect(audit.log).toHaveBeenCalledTimes(1);
  });

  it('never stores request body or sensitive fields', async () => {
    const req = makeReq({ method: 'POST', controllerPath: 'users' });
    req.body = { password: 'super-secret', name: 'Jane', accessToken: 'tok-123' };
    req.user = { id: 'u1', role: 'admin' };
    const next = { handle: () => of({ id: 'u2' }) };

    await firstValueFrom(intercept(audit, created, req, next, { controllerPath: 'users' }));

    const record = audit.log.mock.calls[0][0];
    expect(record).not.toHaveProperty('body');
    expect(record.newValues).toBeUndefined();
    expect(record.oldValues).toBeUndefined();
    const serialized = JSON.stringify(record);
    expect(serialized).not.toContain('super-secret');
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('tok-123');
    expect(serialized).not.toContain('accessToken');
  });

  it('logs a failed login as LOGIN failure without personal data and rethrows', async () => {
    const login = function login() {};
    const req = makeReq({ method: 'POST', controllerPath: 'auth' });
    req.body = { email: 'person@example.com', password: 'x' };
    const next = { handle: () => throwError(() => new UnauthorizedException('bad')) };

    let caught: any;
    await new Promise<void>((resolve) => {
      intercept(audit, login, req, next, { controllerPath: 'auth', isPublic: true }).subscribe({
        error: (err) => {
          caught = err;
          resolve();
        },
      });
    });

    expect(caught).toBeInstanceOf(UnauthorizedException);
    expect(audit.log).toHaveBeenCalledTimes(1);
    const record = audit.log.mock.calls[0][0];
    expect(record.action).toBe(AuditAction.LOGIN);
    expect(record.entityType).toBe('Auth');
    expect(record.description).toContain('outcome=failure');
    expect(JSON.stringify(record)).not.toContain('person@example.com');
  });

  it('logs a successful login as LOGIN with the user id from the response', async () => {
    const login = function login() {};
    const req = makeReq({ method: 'POST', controllerPath: 'auth' });
    const next = {
      handle: () =>
        of({ data: { user: { id: 'u9', role: 'super_admin', tenantId: 't9' } }, message: 'ok' }),
    };

    await firstValueFrom(
      intercept(audit, login, req, next, { controllerPath: 'auth', isPublic: true, httpCode: 200 }),
    );

    const record = audit.log.mock.calls[0][0];
    expect(record.action).toBe(AuditAction.LOGIN);
    expect(record.entityId).toBe('u9');
    expect(record.userId).toBe('u9');
    expect(record.tenantId).toBe('t9');
    expect(record.description).toContain('outcome=success');
  });

  it('logs logout as LOGOUT', async () => {
    const logout = function logout() {};
    const req = makeReq({ method: 'POST', controllerPath: 'auth' });
    req.user = { id: 'u1', role: 'specialist', tenantId: 't1' };
    const next = { handle: () => of({ message: 'ok' }) };

    await firstValueFrom(intercept(audit, logout, req, next, { controllerPath: 'auth' }));

    const record = audit.log.mock.calls[0][0];
    expect(record.action).toBe(AuditAction.LOGOUT);
    expect(record.entityType).toBe('Auth');
    expect(record.userId).toBe('u1');
  });

  it('logs password change as UPDATE on the current user', async () => {
    const changePassword = function changePassword() {};
    const req = makeReq({ method: 'PATCH', controllerPath: 'auth' });
    req.user = { id: 'u1', role: 'specialist', tenantId: 't1' };
    const next = { handle: () => of({ message: 'ok' }) };

    await firstValueFrom(intercept(audit, changePassword, req, next, { controllerPath: 'auth' }));

    const record = audit.log.mock.calls[0][0];
    expect(record.action).toBe(AuditAction.UPDATE);
    expect(record.entityId).toBe('u1');
    expect(record.entityType).toBe('Auth');
  });

  it('skips health and metrics controllers', async () => {
    const healthHandler = function health() {};
    for (const path of ['health', 'metrics']) {
      const req = makeReq({ method: 'POST', controllerPath: path });
      const next = { handle: () => of({ ok: true }) };
      await firstValueFrom(intercept(audit, healthHandler, req, next, { controllerPath: path }));
    }
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('skips public routes that are not auth events', async () => {
    const forgotPassword = function forgotPassword() {};
    const req = makeReq({ method: 'POST', controllerPath: 'auth' });
    const next = { handle: () => of({ message: 'sent' }) };

    await firstValueFrom(
      intercept(audit, forgotPassword, req, next, { controllerPath: 'auth', isPublic: true }),
    );

    expect(audit.log).not.toHaveBeenCalled();
  });
});
