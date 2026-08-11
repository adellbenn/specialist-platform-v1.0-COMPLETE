import { UserPermission, OverrideType } from '../user-permission.entity';

describe('UserPermission Entity', () => {
  describe('OverrideType enum', () => {
    it('should have correct values', () => {
      expect(OverrideType.GRANTED).toBe('granted');
      expect(OverrideType.DENIED).toBe('denied');
    });

    it('should have 2 values', () => {
      expect(Object.keys(OverrideType)).toHaveLength(2);
    });
  });

  describe('UserPermission class', () => {
    it('should be instantiable', () => {
      const up = new UserPermission();
      expect(up).toBeInstanceOf(UserPermission);
    });

    it('should allow setting all properties', () => {
      const up = new UserPermission();
      up.userId = 'user-1';
      up.permissionId = 'perm-1';
      up.overrideType = OverrideType.GRANTED;
      up.grantedById = 'admin-1';
      up.expiresAt = new Date('2026-12-31');
      up.roleId = 'role-1';

      expect(up.userId).toBe('user-1');
      expect(up.permissionId).toBe('perm-1');
      expect(up.overrideType).toBe(OverrideType.GRANTED);
      expect(up.grantedById).toBe('admin-1');
      expect(up.expiresAt).toEqual(new Date('2026-12-31'));
      expect(up.roleId).toBe('role-1');
    });

    it('should support DENIED override type', () => {
      const up = new UserPermission();
      up.overrideType = OverrideType.DENIED;
      expect(up.overrideType).toBe('denied');
    });

    it('should allow nullable fields to be undefined', () => {
      const up = new UserPermission();
      expect(up.grantedById).toBeUndefined();
      expect(up.expiresAt).toBeUndefined();
      expect(up.roleId).toBeUndefined();
    });

    it('should extend AbstractEntity and be a constructor', () => {
      expect(typeof UserPermission).toBe('function');
    });
  });
});
