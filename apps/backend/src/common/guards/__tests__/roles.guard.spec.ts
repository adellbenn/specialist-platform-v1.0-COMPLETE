import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles.guard';
import { UserRole } from '@modules/users/user.entity';
import { ROLES_KEY } from '@common/decorators/keys';

function mockContext(user?: any) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  it('passes when no roles required (undefined)', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined as any);
    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('passes when no roles required (empty array)', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('passes when user role matches required', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.SPECIALIST, UserRole.BENEFICIARY]);
    expect(guard.canActivate(mockContext({ role: UserRole.SPECIALIST }))).toBe(true);
  });

  it('throws when user role not in required', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.SUPER_ADMIN]);
    expect(() =>
      guard.canActivate(mockContext({ role: UserRole.SPECIALIST })),
    ).toThrow(ForbiddenException);
  });

  it('throws with Arabic message', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.SUPER_ADMIN]);
    expect(() =>
      guard.canActivate(mockContext({ role: UserRole.BENEFICIARY })),
    ).toThrow('ليس لديك صلاحية للوصول لهذا المورد');
  });

  it('passes when user role is in a large required list', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.SUPER_ADMIN,
      UserRole.CENTER_MANAGER,
      UserRole.SPECIALIST,
    ]);
    expect(guard.canActivate(mockContext({ role: UserRole.CENTER_MANAGER }))).toBe(true);
  });
});
