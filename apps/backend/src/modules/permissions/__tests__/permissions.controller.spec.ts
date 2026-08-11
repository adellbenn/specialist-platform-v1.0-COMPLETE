import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsController } from '../permissions.controller';
import { PermissionsService } from '../permissions.service';
import { PermissionEngine } from '@common/permissions/permission-engine.service';
import { User } from '@modules/users/user.entity';

describe('PermissionsController', () => {
  let controller: PermissionsController;
  let service: jest.Mocked<PermissionsService>;
  let engine: jest.Mocked<PermissionEngine>;

  const mockUser = {
    id: 'user-1',
    role: 'center_manager',
    roleId: 'role-1',
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [
        {
          provide: PermissionsService,
          useValue: {
            seedPermissions: jest.fn(),
            seedRolesFromMap: jest.fn(),
            findAllPermissions: jest.fn(),
            findPermissionsByModule: jest.fn(),
            findAllRoles: jest.fn(),
            getRoleStats: jest.fn(),
            compareRoles: jest.fn(),
            findRole: jest.fn(),
            createRole: jest.fn(),
            updateRole: jest.fn(),
            duplicateRole: jest.fn(),
            archiveRole: jest.fn(),
            deleteRole: jest.fn(),
            bulkAssignPermissions: jest.fn(),
            findAllGroups: jest.fn(),
            findGroup: jest.fn(),
            createGroup: jest.fn(),
            updateGroup: jest.fn(),
            deleteGroup: jest.fn(),
            seedDefaultGroups: jest.fn(),
            getUserEffectivePermissions: jest.fn(),
            setUserOverride: jest.fn(),
            removeUserOverride: jest.fn(),
          },
        },
        {
          provide: PermissionEngine,
          useValue: {
            getEffectivePermissionsList: jest.fn(),
            authorize: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(PermissionsController);
    service = module.get(PermissionsService);
    engine = module.get(PermissionEngine);
  });

  afterEach(() => jest.clearAllMocks());

  describe('seed', () => {
    it('should seed permissions and roles', async () => {
      service.seedPermissions.mockResolvedValue(50);
      service.seedRolesFromMap.mockResolvedValue([] as any);

      const result = await controller.seed(mockUser);
      expect(result.data).toBe(50);
      expect(service.seedPermissions).toHaveBeenCalled();
      expect(service.seedRolesFromMap).toHaveBeenCalledWith('user-1');
    });
  });

  describe('findAll', () => {
    it('should return all permissions', async () => {
      service.findAllPermissions.mockResolvedValue([{ id: 'p1' }] as any);
      const result = await controller.findAll();
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findByModule', () => {
    it('should return permissions grouped by module', async () => {
      service.findPermissionsByModule.mockResolvedValue({ beneficiaries: [] } as any);
      const result = await controller.findByModule();
      expect(result.data).toBeDefined();
    });
  });

  describe('findAllRoles', () => {
    it('should return all roles', async () => {
      service.findAllRoles.mockResolvedValue([{ id: 'r1' }] as any);
      const result = await controller.findAllRoles();
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getRoleStats', () => {
    it('should return role stats', async () => {
      service.getRoleStats.mockResolvedValue({ total: 5 } as any);
      const result = await controller.getRoleStats();
      expect(result.data.total).toBe(5);
    });
  });

  describe('compareRoles', () => {
    it('should compare roles from query string ids', async () => {
      service.compareRoles.mockResolvedValue([] as any);
      const result = await controller.compareRoles('role-1,role-2');
      expect(service.compareRoles).toHaveBeenCalledWith(['role-1', 'role-2']);
    });
  });

  describe('findRole', () => {
    it('should return a role', async () => {
      service.findRole.mockResolvedValue({ id: 'role-1' } as any);
      const result = await controller.findRole('role-1');
      expect(result.data).toBeDefined();
    });
  });

  describe('createRole', () => {
    it('should create a role', async () => {
      service.createRole.mockResolvedValue({ id: 'new-role' } as any);
      const result = await controller.createRole(
        { name: 'new_role', permissionIds: [] } as any,
        mockUser,
      );
      expect(result.message).toBe('تم إنشاء الدور');
    });
  });

  describe('updateRole', () => {
    it('should update a role', async () => {
      service.updateRole.mockResolvedValue({ id: 'role-1' } as any);
      const result = await controller.updateRole(
        'role-1',
        { name: 'updated' } as any,
        mockUser,
      );
      expect(result.message).toBe('تم تحديث الدور');
    });
  });

  describe('duplicateRole', () => {
    it('should duplicate a role', async () => {
      service.duplicateRole.mockResolvedValue({ id: 'role-2' } as any);
      const result = await controller.duplicateRole('role-1', mockUser);
      expect(result.message).toBe('تم نسخ الدور');
    });
  });

  describe('archiveRole', () => {
    it('should archive a role', async () => {
      service.archiveRole.mockResolvedValue({ message: 'تم أرشفة الدور' });
      const result = await controller.archiveRole('role-1', mockUser);
      expect(result).toEqual({ message: 'تم أرشفة الدور' });
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      service.deleteRole.mockResolvedValue({ message: 'تم حذف الدور' });
      const result = await controller.deleteRole('role-1', mockUser);
      expect(result).toEqual({ message: 'تم حذف الدور' });
    });
  });

  describe('seedRoles', () => {
    it('should seed default roles', async () => {
      service.seedRolesFromMap.mockResolvedValue([] as any);
      const result = await controller.seedRoles(mockUser);
      expect(result.message).toBe('تم بذر الأدوار');
    });
  });

  describe('bulkAssign', () => {
    it('should bulk assign permissions', async () => {
      service.bulkAssignPermissions.mockResolvedValue({ id: 'role-1' } as any);
      const result = await controller.bulkAssign(
        { roleId: 'role-1', permissionIds: ['perm-1'] } as any,
        mockUser,
      );
      expect(result.message).toBe('تم تحديث الصلاحيات');
    });
  });

  describe('myPermissions', () => {
    it('should return permissions list for user with roleId', async () => {
      engine.getEffectivePermissionsList.mockResolvedValue(['perm1', 'perm2'] as any);
      const result = await controller.myPermissions(mockUser);
      expect(result.data).toEqual(['perm1', 'perm2']);
    });

    it('should return legacy permissions for user without roleId', async () => {
      const userNoRole = { ...mockUser, roleId: undefined, role: 'super_admin' } as any;
      const result = await controller.myPermissions(userNoRole);
      expect(result.data).toBeDefined();
    });
  });

  describe('checkPermission', () => {
    it('should check permission', async () => {
      engine.authorize.mockResolvedValue(true as any);
      const result = await controller.checkPermission('dashboard:view', mockUser);
      expect(result.data).toEqual({ permission: 'dashboard:view', allowed: true });
    });
  });

  describe('seedGroups', () => {
    it('should seed default groups', async () => {
      service.seedDefaultGroups.mockResolvedValue([] as any);
      const result = await controller.seedGroups(mockUser);
      expect(result.message).toBe('تم إنشاء المجموعات');
    });
  });

  describe('findAllGroups', () => {
    it('should return all groups', async () => {
      service.findAllGroups.mockResolvedValue([{ id: 'g1' }] as any);
      const result = await controller.findAllGroups();
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findGroup', () => {
    it('should return a group', async () => {
      service.findGroup.mockResolvedValue({ id: 'g1' } as any);
      const result = await controller.findGroup('g1');
      expect(result.data).toBeDefined();
    });
  });

  describe('createGroup', () => {
    it('should create a group', async () => {
      service.createGroup.mockResolvedValue({ id: 'g1' } as any);
      const result = await controller.createGroup(
        { name: 'New Group' } as any,
        mockUser,
      );
      expect(result.message).toBe('تم إنشاء المجموعة');
    });
  });

  describe('updateGroup', () => {
    it('should update a group', async () => {
      service.updateGroup.mockResolvedValue({ id: 'g1' } as any);
      const result = await controller.updateGroup(
        'g1',
        { name: 'Updated' } as any,
        mockUser,
      );
      expect(result.message).toBe('تم تحديث المجموعة');
    });
  });

  describe('deleteGroup', () => {
    it('should delete a group', async () => {
      service.deleteGroup.mockResolvedValue({ message: 'تم حذف المجموعة' });
      const result = await controller.deleteGroup('g1', mockUser);
      expect(result).toEqual({ message: 'تم حذف المجموعة' });
    });
  });

  describe('getUserEffective', () => {
    it('should return user effective permissions', async () => {
      service.getUserEffectivePermissions.mockResolvedValue({
        granted: [],
        denied: [],
      });
      const result = await controller.getUserEffective('user-2');
      expect(result.data).toBeDefined();
    });
  });

  describe('setOverride', () => {
    it('should set user override', async () => {
      service.setUserOverride.mockResolvedValue({ message: 'تم تحديث التجاوز' });
      const result = await controller.setOverride(
        { userId: 'user-2', permissionId: 'perm-1', overrideType: 'granted' } as any,
        mockUser,
      );
      expect(result).toEqual({ message: 'تم تحديث التجاوز' });
    });
  });

  describe('removeOverride', () => {
    it('should remove user override', async () => {
      service.removeUserOverride.mockResolvedValue({ message: 'تم إزالة التجاوز' });
      const result = await controller.removeOverride('user-2', 'perm-1', mockUser);
      expect(result).toEqual({ message: 'تم إزالة التجاوز' });
    });
  });
});
