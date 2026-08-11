import { PermissionEngine } from '../permission-engine.service';
import { UserRole } from '@modules/users/user.entity';
import { OverrideType } from '@modules/permissions/user-permission.entity';

jest.mock('@common/permissions/role-permissions', () => ({
  getPermissionsForRole: jest.fn().mockReturnValue(['dashboard:view', 'beneficiary:view_all']),
}));

function mockRepo() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
  };
}

function mockRedis() {
  return {
    getJson: jest.fn(),
    setJson: jest.fn(),
    del: jest.fn(),
  };
}

describe('PermissionEngine', () => {
  let engine: PermissionEngine;
  let roleRepo: any;
  let permRepo: any;
  let userPermRepo: any;
  let redisService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    roleRepo = mockRepo();
    permRepo = mockRepo();
    userPermRepo = mockRepo();
    redisService = mockRedis();
    engine = new PermissionEngine(roleRepo, permRepo, userPermRepo, redisService);
  });

  describe('authorize', () => {
    it('returns true for SUPER_ADMIN', async () => {
      const result = await engine.authorize(
        { id: 'u1', role: UserRole.SUPER_ADMIN },
        'any:perm',
      );
      expect(result).toBe(true);
    });

    it('returns false for role without permission', async () => {
      redisService.getJson.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue({ permissions: [] });
      userPermRepo.find.mockResolvedValue([]);
      redisService.setJson.mockResolvedValue(undefined);

      const result = await engine.authorize(
        { id: 'u1', role: UserRole.SPECIALIST, roleId: 'r1' },
        'nonexistent:perm',
      );
      expect(result).toBe(false);
    });
  });

  describe('authorizeAll', () => {
    it('returns allowed: true for SUPER_ADMIN', async () => {
      const result = await engine.authorizeAll(
        { id: 'u1', role: UserRole.SUPER_ADMIN },
        ['a', 'b'],
      );
      expect(result).toEqual({ allowed: true, missing: [] });
    });

    it('returns missing permissions for non-admin with roleId', async () => {
      redisService.getJson.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue({
        permissions: [{ module: 'dashboard', action: 'view' }],
      });
      userPermRepo.find.mockResolvedValue([]);
      redisService.setJson.mockResolvedValue(undefined);

      const result = await engine.authorizeAll(
        { id: 'u1', role: UserRole.SPECIALIST, roleId: 'r1' },
        ['dashboard:view', 'user:delete'],
      );
      expect(result.allowed).toBe(false);
      expect(result.missing).toContain('user:delete');
    });

    it('returns allowed when all permissions present', async () => {
      redisService.getJson.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue({
        permissions: [
          { module: 'dashboard', action: 'view' },
          { module: 'user', action: 'delete' },
        ],
      });
      userPermRepo.find.mockResolvedValue([]);
      redisService.setJson.mockResolvedValue(undefined);

      const result = await engine.authorizeAll(
        { id: 'u1', role: UserRole.SPECIALIST, roleId: 'r1' },
        ['dashboard:view', 'user:delete'],
      );
      expect(result.allowed).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('uses static fallback when no roleId', async () => {
      const result = await engine.authorizeAll(
        { id: 'u1', role: UserRole.SPECIALIST },
        ['dashboard:view'],
      );
      expect(result.allowed).toBe(true);
    });
  });

  describe('getEffectivePermissions', () => {
    it('returns cached permissions when available', async () => {
      redisService.getJson.mockResolvedValue(['dashboard:view', 'user:create']);
      const result = await engine.getEffectivePermissions('u1', 'r1');
      expect(result.has('dashboard:view')).toBe(true);
      expect(result.has('user:create')).toBe(true);
      expect(roleRepo.findOne).not.toHaveBeenCalled();
    });

    it('queries DB on cache miss and caches result', async () => {
      redisService.getJson.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue({
        permissions: [{ module: 'a', action: 'b' }],
      });
      userPermRepo.find.mockResolvedValue([]);
      redisService.setJson.mockResolvedValue(undefined);

      const result = await engine.getEffectivePermissions('u1', 'r1');
      expect(result.has('a:b')).toBe(true);
      expect(redisService.setJson).toHaveBeenCalledWith(
        'perms:u1',
        ['a:b'],
        300,
      );
    });

    it('applies DENIED override', async () => {
      redisService.getJson.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue({
        permissions: [{ module: 'a', action: 'b' }, { module: 'c', action: 'd' }],
      });
      userPermRepo.find.mockResolvedValue([
        {
          overrideType: OverrideType.DENIED,
          permission: { module: 'a', action: 'b' },
        },
      ]);
      redisService.setJson.mockResolvedValue(undefined);

      const result = await engine.getEffectivePermissions('u1', 'r1');
      expect(result.has('a:b')).toBe(false);
      expect(result.has('c:d')).toBe(true);
    });

    it('applies GRANTED override', async () => {
      redisService.getJson.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue({
        permissions: [{ module: 'a', action: 'b' }],
      });
      userPermRepo.find.mockResolvedValue([
        {
          overrideType: OverrideType.GRANTED,
          permission: { module: 'x', action: 'y' },
        },
      ]);
      redisService.setJson.mockResolvedValue(undefined);

      const result = await engine.getEffectivePermissions('u1', 'r1');
      expect(result.has('x:y')).toBe(true);
    });

    it('handles missing roleEntity gracefully', async () => {
      redisService.getJson.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue(null);
      userPermRepo.find.mockResolvedValue([]);
      redisService.setJson.mockResolvedValue(undefined);

      const result = await engine.getEffectivePermissions('u1', 'r1');
      expect(result.size).toBe(0);
    });

    it('for SUPER_ADMIN role, fetches all permissions from DB', async () => {
      redisService.getJson.mockResolvedValue(null);
      permRepo.find.mockResolvedValue([
        { module: 'a', action: 'b' },
        { module: 'c', action: 'd' },
      ]);
      redisService.setJson.mockResolvedValue(undefined);

      const result = await engine.getEffectivePermissions('u1', 'r1', UserRole.SUPER_ADMIN);
      expect(result.has('a:b')).toBe(true);
      expect(result.has('c:d')).toBe(true);
      expect(permRepo.find).toHaveBeenCalledWith({ select: ['module', 'action'] });
    });
  });

  describe('getEffectivePermissionsList', () => {
    it('returns array from getEffectivePermissions', async () => {
      redisService.getJson.mockResolvedValue(['a:b']);
      const result = await engine.getEffectivePermissionsList('u1', 'r1');
      expect(result).toEqual(['a:b']);
    });
  });

  describe('invalidateUserPermissions', () => {
    it('calls redis del with correct key', async () => {
      await engine.invalidateUserPermissions('u1');
      expect(redisService.del).toHaveBeenCalledWith('perms:u1');
    });
  });

  describe('getStaticFallback', () => {
    it('returns permissions from getPermissionsForRole', async () => {
      const result = await engine.authorizeAll(
        { id: 'u1', role: UserRole.SPECIALIST },
        ['dashboard:view'],
      );
      expect(result.allowed).toBe(true);
    });
  });
});
