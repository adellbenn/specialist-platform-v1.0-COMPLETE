import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantGuard } from '../tenant.guard';
import { UserRole } from '@modules/users/user.entity';

function mockContext(user?: any) {
  const req = { user };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
}

describe('TenantGuard', () => {
  let guard: TenantGuard;

  beforeEach(() => {
    guard = new TenantGuard();
  });

  it('returns true for super_admin (bypasses tenant check)', () => {
    const ctx = mockContext({ role: UserRole.SUPER_ADMIN });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException when user has no tenantId', () => {
    const ctx = mockContext({ role: UserRole.SPECIALIST, tenantId: null });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws with Arabic message when no tenantId', () => {
    const ctx = mockContext({ role: UserRole.SPECIALIST, tenantId: null });
    expect(() => guard.canActivate(ctx)).toThrow('المستخدم غير مرتبط بأي مركز');
  });

  it('sets request.tenantId and returns true when user has tenantId', () => {
    const req: any = { user: { role: UserRole.SPECIALIST, tenantId: 't-123' } };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(req.tenantId).toBe('t-123');
  });

  it('returns true for center_manager with tenantId', () => {
    const req: any = { user: { role: UserRole.CENTER_MANAGER, tenantId: 't-456' } };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(ctx)).toBe(true);
    expect(req.tenantId).toBe('t-456');
  });

  it('returns true for beneficiary with tenantId', () => {
    const req: any = { user: { role: UserRole.BENEFICIARY, tenantId: 't-789' } };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(ctx)).toBe(true);
    expect(req.tenantId).toBe('t-789');
  });

  it('throws when tenantId is undefined', () => {
    const ctx = mockContext({ role: UserRole.RECEPTIONIST });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
