import 'reflect-metadata';
import {
  Public,
  SkipRbac,
  Roles,
  RequirePermissions,
  AdminOnly,
  CurrentUser,
  TenantId,
  IS_PUBLIC_KEY,
  SKIP_RBAC_KEY,
  ROLES_KEY,
  PERMISSIONS_KEY,
} from '../index';
import { UserRole } from '@modules/users/user.entity';
import { Permission } from '@common/permissions/permissions.enum';

describe('Decorators', () => {
  describe('@Public', () => {
    it('should set isPublic metadata to true', () => {
      class TestController {
        @Public() method() {}
      }
      const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestController.prototype.method);
      expect(metadata).toBe(true);
    });
  });

  describe('@SkipRbac', () => {
    it('should set skipRbac metadata to true', () => {
      class TestController {
        @SkipRbac() method() {}
      }
      const metadata = Reflect.getMetadata(SKIP_RBAC_KEY, TestController.prototype.method);
      expect(metadata).toBe(true);
    });
  });

  describe('@Roles', () => {
    it('should set roles metadata', () => {
      const roles = [UserRole.SUPER_ADMIN, UserRole.CENTER_MANAGER];
      class TestController {
        @Roles(...roles) method() {}
      }
      const metadata = Reflect.getMetadata(ROLES_KEY, TestController.prototype.method);
      expect(metadata).toEqual(roles);
    });
  });

  describe('@RequirePermissions', () => {
    it('should set permissions metadata', () => {
      const perms = [Permission.BENEFICIARY_CREATE, Permission.REPORT_APPROVE];
      class TestController {
        @RequirePermissions(...perms) method() {}
      }
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, TestController.prototype.method);
      expect(metadata).toEqual(perms);
    });
  });

  describe('@AdminOnly', () => {
    it('should set admin roles metadata', () => {
      @AdminOnly()
      class TestController {}

      const metadata = Reflect.getMetadata(ROLES_KEY, TestController);
      expect(metadata).toBeDefined();
      expect(Array.isArray(metadata)).toBe(true);
      (metadata as UserRole[]).forEach((r) => {
        expect(['super_admin', 'center_manager', 'supervisor', 'accountant']).toContain(r);
      });
    });
  });

  describe('CurrentUser', () => {
    it('should be a function', () => {
      expect(typeof CurrentUser).toBe('function');
    });

    it('should return a parameter decorator when called', () => {
      const decorator = CurrentUser();
      expect(typeof decorator).toBe('function');
    });
  });

  describe('TenantId', () => {
    it('should be a function', () => {
      expect(typeof TenantId).toBe('function');
    });

    it('should return a parameter decorator when called', () => {
      const decorator = TenantId();
      expect(typeof decorator).toBe('function');
    });
  });
});
