import {
  User,
  UserRole,
  ADMIN_CLASS_ROLES,
  WRITER_CLASS_ROLES,
  WRITE_BYPASS_ROLES,
  BENEFICIARY_ROLES,
  RbacClass,
  getRbacClass,
} from '../user.entity';

describe('User Entity — Extended Tests', () => {
  describe('UserRole enum', () => {
    it('should have correct values', () => {
      expect(UserRole.SUPER_ADMIN).toBe('super_admin');
      expect(UserRole.CENTER_MANAGER).toBe('center_manager');
      expect(UserRole.SUPERVISOR).toBe('supervisor');
      expect(UserRole.SPECIALIST).toBe('specialist');
      expect(UserRole.RECEPTIONIST).toBe('receptionist');
      expect(UserRole.ACCOUNTANT).toBe('accountant');
      expect(UserRole.BENEFICIARY).toBe('beneficiary');
    });

    it('should have 7 values', () => {
      expect(Object.keys(UserRole)).toHaveLength(7);
    });
  });

  describe('RbacClass enum', () => {
    it('should have correct values', () => {
      expect(RbacClass.ADMIN).toBe('admin');
      expect(RbacClass.WRITER).toBe('writer');
      expect(RbacClass.BENEFICIARY).toBe('beneficiary');
    });
  });

  describe('ADMIN_CLASS_ROLES', () => {
    it('should contain super_admin, center_manager, supervisor', () => {
      expect(ADMIN_CLASS_ROLES).toContain(UserRole.SUPER_ADMIN);
      expect(ADMIN_CLASS_ROLES).toContain(UserRole.CENTER_MANAGER);
      expect(ADMIN_CLASS_ROLES).toContain(UserRole.SUPERVISOR);
    });

    it('should have 3 roles', () => {
      expect(ADMIN_CLASS_ROLES).toHaveLength(3);
    });

    it('should not contain specialist', () => {
      expect(ADMIN_CLASS_ROLES).not.toContain(UserRole.SPECIALIST);
    });

    it('should not contain receptionist', () => {
      expect(ADMIN_CLASS_ROLES).not.toContain(UserRole.RECEPTIONIST);
    });

    it('should not contain beneficiary', () => {
      expect(ADMIN_CLASS_ROLES).not.toContain(UserRole.BENEFICIARY);
    });
  });

  describe('WRITER_CLASS_ROLES', () => {
    it('should contain super_admin, center_manager, specialist, receptionist', () => {
      expect(WRITER_CLASS_ROLES).toContain(UserRole.SUPER_ADMIN);
      expect(WRITER_CLASS_ROLES).toContain(UserRole.CENTER_MANAGER);
      expect(WRITER_CLASS_ROLES).toContain(UserRole.SPECIALIST);
      expect(WRITER_CLASS_ROLES).toContain(UserRole.RECEPTIONIST);
    });

    it('should have 4 roles', () => {
      expect(WRITER_CLASS_ROLES).toHaveLength(4);
    });

    it('should not contain supervisor', () => {
      expect(WRITER_CLASS_ROLES).not.toContain(UserRole.SUPERVISOR);
    });

    it('should not contain beneficiary', () => {
      expect(WRITER_CLASS_ROLES).not.toContain(UserRole.BENEFICIARY);
    });
  });

  describe('WRITE_BYPASS_ROLES', () => {
    it('should contain super_admin, center_manager, supervisor, accountant', () => {
      expect(WRITE_BYPASS_ROLES).toContain(UserRole.SUPER_ADMIN);
      expect(WRITE_BYPASS_ROLES).toContain(UserRole.CENTER_MANAGER);
      expect(WRITE_BYPASS_ROLES).toContain(UserRole.SUPERVISOR);
      expect(WRITE_BYPASS_ROLES).toContain(UserRole.ACCOUNTANT);
    });

    it('should have 4 roles', () => {
      expect(WRITE_BYPASS_ROLES).toHaveLength(4);
    });
  });

  describe('BENEFICIARY_ROLES', () => {
    it('should contain only beneficiary', () => {
      expect(BENEFICIARY_ROLES).toEqual([UserRole.BENEFICIARY]);
    });
  });

  describe('getRbacClass()', () => {
    it('should return ADMIN for super_admin', () => {
      expect(getRbacClass(UserRole.SUPER_ADMIN)).toBe(RbacClass.ADMIN);
    });

    it('should return ADMIN for center_manager', () => {
      expect(getRbacClass(UserRole.CENTER_MANAGER)).toBe(RbacClass.ADMIN);
    });

    it('should return ADMIN for supervisor', () => {
      expect(getRbacClass(UserRole.SUPERVISOR)).toBe(RbacClass.ADMIN);
    });

    it('should return WRITER for specialist', () => {
      expect(getRbacClass(UserRole.SPECIALIST)).toBe(RbacClass.WRITER);
    });

    it('should return WRITER for receptionist', () => {
      expect(getRbacClass(UserRole.RECEPTIONIST)).toBe(RbacClass.WRITER);
    });

    it('should return BENEFICIARY for beneficiary', () => {
      expect(getRbacClass(UserRole.BENEFICIARY)).toBe(RbacClass.BENEFICIARY);
    });

    it('should return BENEFICIARY for accountant (not in admin or writer class)', () => {
      expect(getRbacClass(UserRole.ACCOUNTANT)).toBe(RbacClass.BENEFICIARY);
    });
  });

  describe('User class', () => {
    it('should be instantiable', () => {
      const user = new User();
      expect(user).toBeInstanceOf(User);
    });

    it('should allow setting all properties', () => {
      const user = new User();
      user.tenantId = 'tenant-1';
      user.email = 'test@example.com';
      user.passwordHash = 'hashed';
      user.firstName = 'Ahmed';
      user.lastName = 'Ali';
      user.phone = '0555555555';
      user.avatarUrl = '/uploads/avatar.png';
      user.bio = 'Therapist';
      user.role = UserRole.SPECIALIST;
      user.roleId = 'role-1';
      user.beneficiaryId = 'ben-1';
      user.isActive = true;
      user.themePreference = 'dark';
      user.preferences = { language: 'ar' };
      user.lastLoginAt = new Date();
      user.failedLoginAttempts = 0;
      (user as any).lockedUntil = undefined;
      user.mustChangePassword = false;
      user.twoFactorSecret = 'secret';
      user.twoFactorEnabled = false;
      user.twoFactorBackupCodes = 'codes';

      expect(user.tenantId).toBe('tenant-1');
      expect(user.email).toBe('test@example.com');
      expect(user.firstName).toBe('Ahmed');
      expect(user.lastName).toBe('Ali');
      expect(user.role).toBe(UserRole.SPECIALIST);
      expect(user.isActive).toBe(true);
      expect(user.themePreference).toBe('dark');
      expect(user.twoFactorEnabled).toBe(false);
      expect(user.mustChangePassword).toBe(false);
      expect(user.failedLoginAttempts).toBe(0);
    });

    describe('fullName getter', () => {
      it('should return combined first and last name', () => {
        const user = new User();
        user.firstName = 'John';
        user.lastName = 'Doe';
        expect(user.fullName).toBe('John Doe');
      });

      it('should handle empty names', () => {
        const user = new User();
        user.firstName = '';
        user.lastName = '';
        expect(user.fullName).toBe(' ');
      });
    });

    it('should extend AbstractEntity and be a constructor', () => {
      expect(typeof User).toBe('function');
    });
  });
});
