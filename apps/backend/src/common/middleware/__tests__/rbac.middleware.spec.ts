import { ForbiddenException } from '@nestjs/common';
import { RbacMiddleware } from '../rbac.middleware';

jest.mock('@modules/users/user.entity', () => {
  const actual = jest.requireActual('@modules/users/user.entity');
  return { ...actual };
});

function mockReqResNext(opts: { method?: string; path?: string; user?: any }) {
  return {
    req: {
      method: opts.method || 'GET',
      path: opts.path || '/api/v1/test',
      user: opts.user,
    } as any,
    res: {} as any,
    next: jest.fn() as any,
  };
}

describe('RbacMiddleware', () => {
  let middleware: RbacMiddleware;

  beforeEach(() => {
    middleware = new RbacMiddleware();
  });

  it('calls next() for exempt paths', () => {
    const { req, res, next } = mockReqResNext({ path: '/api/v1/auth/login' });
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('calls next() for /api/v1/auth/refresh', () => {
    const { req, res, next } = mockReqResNext({ path: '/api/v1/auth/refresh' });
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('calls next() for /api/v1/auth/logout', () => {
    const { req, res, next } = mockReqResNext({ path: '/api/v1/auth/logout' });
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('calls next() for /api/docs', () => {
    const { req, res, next } = mockReqResNext({ path: '/api/docs' });
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('calls next() when no user or no role', () => {
    const { req, res, next } = mockReqResNext({ user: undefined });
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('calls next() when user has no role', () => {
    const { req, res, next } = mockReqResNext({ user: { name: 'test' } });
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('calls next() for GET request (non-write)', () => {
    const { req, res, next } = mockReqResNext({
      method: 'GET',
      user: { role: 'supervisor' },
    });
    middleware.use(req, res, next);
    expect(req.rbacClass).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it('calls next() for WRITE_BYPASS_ROLES (super_admin)', () => {
    const { req, res, next } = mockReqResNext({
      method: 'POST',
      user: { role: 'super_admin' },
    });
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('calls next() for WRITE_BYPASS_ROLES (center_manager)', () => {
    const { req, res, next } = mockReqResNext({
      method: 'DELETE',
      user: { role: 'center_manager' },
    });
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('calls next() for WRITE_BYPASS_ROLES (supervisor)', () => {
    const { req, res, next } = mockReqResNext({
      method: 'PUT',
      user: { role: 'supervisor' },
    });
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('calls next() for WRITE_BYPASS_ROLES (accountant)', () => {
    const { req, res, next } = mockReqResNext({
      method: 'PATCH',
      user: { role: 'accountant' },
    });
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('allows ADMIN class write when role is in WRITE_BYPASS_ROLES (supervisor)', () => {
    const { req, res, next } = mockReqResNext({
      method: 'POST',
      user: { role: 'supervisor' },
      path: '/api/v1/beneficiaries',
    });
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('allows ADMIN class PUT when role is in WRITE_BYPASS_ROLES (supervisor)', () => {
    const { req, res, next } = mockReqResNext({
      method: 'PUT',
      user: { role: 'supervisor' },
      path: '/api/v1/reports/1',
    });
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('throws for BENEFICIARY write to non-allowed path', () => {
    const { req, res, next } = mockReqResNext({
      method: 'POST',
      user: { role: 'beneficiary' },
      path: '/api/v1/sessions',
    });
    expect(() => middleware.use(req, res, next)).toThrow(ForbiddenException);
  });

  it('throws Arabic message for beneficiary write blocked', () => {
    const { req, res, next } = mockReqResNext({
      method: 'DELETE',
      user: { role: 'beneficiary' },
      path: '/api/v1/reports/1',
    });
    expect(() => middleware.use(req, res, next)).toThrow(
      'المستفيد لا يملك صلاحية هذه العملية',
    );
  });

  it('allows BENEFICIARY write to /api/v1/beneficiaries/me', () => {
    const { req, res, next } = mockReqResNext({
      method: 'PATCH',
      user: { role: 'beneficiary' },
      path: '/api/v1/beneficiaries/me',
    });
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('allows BENEFICIARY write to /api/v1/auth/', () => {
    const { req, res, next } = mockReqResNext({
      method: 'POST',
      user: { role: 'beneficiary' },
      path: '/api/v1/auth/change-password',
    });
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('allows WRITER class write', () => {
    const { req, res, next } = mockReqResNext({
      method: 'POST',
      user: { role: 'specialist' },
      path: '/api/v1/sessions',
    });
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
