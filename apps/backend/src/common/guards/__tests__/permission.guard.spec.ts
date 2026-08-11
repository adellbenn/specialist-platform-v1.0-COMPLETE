import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from '../permission.guard';
import { PermissionEngine } from '@common/permissions/permission-engine.service';
import { PERMISSIONS_KEY } from '@common/decorators/keys';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: jest.Mocked<Reflector>;
  let engine: jest.Mocked<PermissionEngine>;

  function mockContext(user?: any) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    engine = { authorizeAll: jest.fn() } as any;
    guard = new PermissionGuard(reflector, engine);
  });

  it('returns true when no permissions required', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined as any);
    expect(await guard.canActivate(mockContext())).toBe(true);
  });

  it('returns true when permissions array is empty', async () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    expect(await guard.canActivate(mockContext())).toBe(true);
  });

  it('returns false when no user on request', async () => {
    reflector.getAllAndOverride.mockReturnValue(['perm:a']);
    expect(await guard.canActivate(mockContext(undefined))).toBe(false);
  });

  it('returns true when engine allows all permissions', async () => {
    reflector.getAllAndOverride.mockReturnValue(['perm:a', 'perm:b']);
    engine.authorizeAll.mockResolvedValue({ allowed: true, missing: [] });
    const ctx = mockContext({ id: 'u1', role: 'specialist' });
    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException with Arabic message when denied', async () => {
    reflector.getAllAndOverride.mockReturnValue(['perm:x', 'perm:y']);
    engine.authorizeAll.mockResolvedValue({ allowed: false, missing: ['perm:y'] });
    const ctx = mockContext({ id: 'u1', role: 'specialist' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'perm:y',
    );
  });
});
