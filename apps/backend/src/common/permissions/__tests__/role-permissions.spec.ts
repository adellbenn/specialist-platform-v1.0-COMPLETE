import { Permission } from '../permissions.enum';
import { roleHasPermission, getPermissionsForRole, ROLE_PERMISSIONS, DISABLED_ROLES } from '../role-permissions';

describe('RolePermissions', () => {
  describe('super_admin', () => {
    it('should have all permissions', () => {
      const allPermissions = Object.values(Permission);
      const adminPermissions = getPermissionsForRole('super_admin');
      allPermissions.forEach((p) => {
        expect(adminPermissions).toContain(p);
      });
    });
  });

  describe('center_manager', () => {
    it('should have beneficiary view all', () => {
      expect(roleHasPermission('center_manager', Permission.BENEFICIARY_VIEW_ALL)).toBe(true);
    });

    it('should have payment view', () => {
      expect(roleHasPermission('center_manager', Permission.PAYMENT_VIEW)).toBe(true);
    });

    it('should NOT have beneficiary view self', () => {
      expect(roleHasPermission('center_manager', Permission.BENEFICIARY_VIEW_SELF)).toBe(false);
    });
  });

  describe('specialist', () => {
    it('should have beneficiary view own', () => {
      expect(roleHasPermission('specialist', Permission.BENEFICIARY_VIEW_OWN)).toBe(true);
    });

    it('should NOT have beneficiary view all', () => {
      expect(roleHasPermission('specialist', Permission.BENEFICIARY_VIEW_ALL)).toBe(false);
    });

    it('should have report create', () => {
      expect(roleHasPermission('specialist', Permission.REPORT_CREATE)).toBe(true);
    });

    it('should NOT have report approve', () => {
      expect(roleHasPermission('specialist', Permission.REPORT_APPROVE)).toBe(false);
    });
  });

  describe('accountant', () => {
    it('should be disabled — all permission checks return false', () => {
      expect(roleHasPermission('accountant', Permission.PAYMENT_VIEW)).toBe(false);
      expect(roleHasPermission('accountant', Permission.PAYMENT_CREATE)).toBe(false);
      expect(roleHasPermission('accountant', Permission.USER_VIEW)).toBe(false);
      expect(roleHasPermission('accountant', Permission.USER_CREATE)).toBe(false);
    });

    it('getPermissionsForRole should return empty array', () => {
      expect(getPermissionsForRole('accountant')).toEqual([]);
    });
  });

  describe('receptionist', () => {
    it('should have appointment create', () => {
      expect(roleHasPermission('receptionist', Permission.APPOINTMENT_CREATE)).toBe(true);
    });

    it('should NOT have session management', () => {
      expect(roleHasPermission('receptionist', Permission.SESSION_VIEW_ALL)).toBe(false);
    });
  });

  describe('beneficiary', () => {
    it('should have view self permissions', () => {
      expect(roleHasPermission('beneficiary', Permission.BENEFICIARY_VIEW_SELF)).toBe(true);
      expect(roleHasPermission('beneficiary', Permission.APPOINTMENT_VIEW_SELF)).toBe(true);
    });

    it('should NOT have admin permissions', () => {
      expect(roleHasPermission('beneficiary', Permission.USER_VIEW)).toBe(false);
      expect(roleHasPermission('beneficiary', Permission.DASHBOARD_STATS)).toBe(false);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return empty array for unknown role', () => {
      const result = getPermissionsForRole('unknown' as any);
      expect(result).toEqual([]);
    });

    it('should return permissions for known, non-disabled roles', () => {
      Object.keys(ROLE_PERMISSIONS).forEach((role) => {
        const perms = getPermissionsForRole(role as any);
        expect(Array.isArray(perms)).toBe(true);
        if (DISABLED_ROLES.has(role as any)) {
          expect(perms).toEqual([]);
        } else {
          expect(perms.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('roleHasPermission', () => {
    it('should return false for unknown role', () => {
      expect(roleHasPermission('unknown' as any, Permission.DASHBOARD_VIEW)).toBe(false);
    });

    it('should return false for unknown permission', () => {
      expect(roleHasPermission('beneficiary', Permission.USER_CREATE)).toBe(false);
    });
  });
});
