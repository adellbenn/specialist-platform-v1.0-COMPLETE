import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacGuard } from '../rbac.guard';
import { getRbacClass, RbacClass, WRITE_BYPASS_ROLES } from '@modules/users/user.entity';
import { SKIP_RBAC_KEY } from '@common/decorators/keys';

jest.mock('@modules/users/user.entity', () => {
  const actual = jest.requireActual('@modules/users/user.entity');
  return { ...actual };
});

function mockContext(opts: { method?: string; user?: any; path?: string; skipRbac?: boolean }) {
  const reflectorGet = jest.fn().mockImplementation((key: string) => {
    if (key === SKIP_RBAC_KEY) return opts.skipRbac ?? false;
    return undefined;
  });
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method: opts.method || 'GET',
        user: opts.user,
        path: opts.path || '/api/v1/test',
      }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
    reflector: reflectorGet,
  } as unknown as ExecutionContext;
}

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RbacGuard(reflector);
  });

  it('returns true when skipRbac metadata is set', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = mockContext({});
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when no user on request', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = mockContext({ user: undefined });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true for WRITE_BYPASS_ROLES (super_admin)', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = mockContext({ method: 'POST', user: { role: 'super_admin' } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true for WRITE_BYPASS_ROLES (center_manager)', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = mockContext({ method: 'DELETE', user: { role: 'center_manager' } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true for WRITE_BYPASS_ROLES (supervisor)', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = mockContext({ method: 'PUT', user: { role: 'supervisor' } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true for WRITE_BYPASS_ROLES (accountant)', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = mockContext({ method: 'PATCH', user: { role: 'accountant' } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows GET for admin class', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = mockContext({ method: 'GET', user: { role: 'supervisor' } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows ADMIN class with write method when role is also in WRITE_BYPASS_ROLES', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = mockContext({ method: 'POST', user: { role: 'supervisor' } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows ADMIN class with PUT when role is also in WRITE_BYPASS_ROLES', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = mockContext({ method: 'PUT', user: { role: 'supervisor' } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows ADMIN class with DELETE when role is also in WRITE_BYPASS_ROLES', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = mockContext({ method: 'DELETE', user: { role: 'supervisor' } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws for BENEFICIARY class with write to non-allowed path', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = mockContext({
      method: 'POST',
      user: { role: 'beneficiary' },
      path: '/api/v1/sessions',
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('allows BENEFICIARY write to /api/v1/beneficiaries/me', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = mockContext({
      method: 'PATCH',
      user: { role: 'beneficiary' },
      path: '/api/v1/beneficiaries/me',
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows BENEFICIARY write to /api/v1/auth/', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = mockContext({
      method: 'POST',
      user: { role: 'beneficiary' },
      path: '/api/v1/auth/change-password',
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows BENEFICIARY GET', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = mockContext({
      method: 'GET',
      user: { role: 'beneficiary' },
      path: '/api/v1/reports',
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows WRITER class write', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = mockContext({
      method: 'POST',
      user: { role: 'specialist' },
      path: '/api/v1/sessions',
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
