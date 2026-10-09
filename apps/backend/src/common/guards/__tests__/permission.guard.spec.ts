import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from '../permission.guard';
import { PermissionEngine } from '@common/permissions/permission-engine.service';
import { PERMISSIONS_KEY, PERMISSIONS_ANY_KEY } from '@common/decorators/keys';

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

  function setMetadata(all?: string[], any?: string[]) {
    reflector.getAllAndOverride.mockImplementation((key: any) => {
      if (key === PERMISSIONS_KEY) return all as any;
      if (key === PERMISSIONS_ANY_KEY) return any as any;
      return undefined as any;
    });
  }

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    engine = { authorizeAll: jest.fn(), authorizeAny: jest.fn() } as any;
    guard = new PermissionGuard(reflector, engine);
  });

  it('returns true when no permissions required', async () => {
    setMetadata(undefined, undefined);
    expect(await guard.canActivate(mockContext())).toBe(true);
  });

  it('returns true when permissions arrays are empty', async () => {
    setMetadata([], []);
    expect(await guard.canActivate(mockContext())).toBe(true);
  });

  it('returns false when no user on request', async () => {
    setMetadata(['perm:a'], undefined);
    expect(await guard.canActivate(mockContext(undefined))).toBe(false);
  });

  it('returns true when engine allows all (AND)', async () => {
    setMetadata(['perm:a', 'perm:b'], undefined);
    engine.authorizeAll.mockResolvedValue({ allowed: true, missing: [] });
    const ctx = mockContext({ id: 'u1', role: 'specialist' });
    expect(await guard.canActivate(ctx)).toBe(true);
    expect(engine.authorizeAny).not.toHaveBeenCalled();
  });

  it('throws with Arabic message when AND denied', async () => {
    setMetadata(['perm:x', 'perm:y'], undefined);
    engine.authorizeAll.mockResolvedValue({ allowed: false, missing: ['perm:y'] });
    const ctx = mockContext({ id: 'u1', role: 'specialist' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(ctx)).rejects.toThrow('perm:y');
  });

  it('returns true when OR allows with at least one key', async () => {
    setMetadata(undefined, ['perm:a', 'perm:b']);
    engine.authorizeAny.mockResolvedValue({ allowed: true, missing: [] });
    const ctx = mockContext({ id: 'u1', role: 'specialist' });
    expect(await guard.canActivate(ctx)).toBe(true);
    expect(engine.authorizeAny).toHaveBeenCalledWith(ctx.switchToHttp().getRequest().user, [
      'perm:a',
      'perm:b',
    ]);
    expect(engine.authorizeAll).not.toHaveBeenCalled();
  });

  it('throws when OR has none of the keys', async () => {
    setMetadata(undefined, ['perm:a', 'perm:b']);
    engine.authorizeAny.mockResolvedValue({ allowed: false, missing: ['perm:a', 'perm:b'] });
    const ctx = mockContext({ id: 'u1', role: 'beneficiary' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('requires BOTH when AND and OR decorators are present', async () => {
    setMetadata(['perm:all'], ['perm:any']);
    engine.authorizeAll.mockResolvedValue({ allowed: true, missing: [] });
    engine.authorizeAny.mockResolvedValue({ allowed: true, missing: [] });
    const ctx = mockContext({ id: 'u1', role: 'specialist' });
    expect(await guard.canActivate(ctx)).toBe(true);
    expect(engine.authorizeAll).toHaveBeenCalled();
    expect(engine.authorizeAny).toHaveBeenCalled();
  });

  it('throws when AND fails while OR would pass (both present)', async () => {
    setMetadata(['perm:all'], ['perm:any']);
    engine.authorizeAll.mockResolvedValue({ allowed: false, missing: ['perm:all'] });
    const ctx = mockContext({ id: 'u1', role: 'specialist' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    expect(engine.authorizeAny).not.toHaveBeenCalled();
  });

  it('throws when OR fails while AND would pass (both present)', async () => {
    setMetadata(['perm:all'], ['perm:any']);
    engine.authorizeAll.mockResolvedValue({ allowed: true, missing: [] });
    engine.authorizeAny.mockResolvedValue({ allowed: false, missing: ['perm:any'] });
    const ctx = mockContext({ id: 'u1', role: 'specialist' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});
