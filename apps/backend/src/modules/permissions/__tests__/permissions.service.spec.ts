import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PermissionsService } from '../permissions.service';
import { Permission, PermissionAction, PermissionModule } from '../permission.entity';
import { Role } from '../role.entity';
import { PermissionGroup } from '../permission-group.entity';
import { UserPermission, OverrideType } from '../user-permission.entity';
import { AuditLogService } from '@modules/audit-log/audit-log.module';
import { AuditAction } from '@modules/audit-log/audit-log.entity';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let permRepo: jest.Mocked<Repository<Permission>>;
  let roleRepo: jest.Mocked<Repository<Role>>;
  let groupRepo: jest.Mocked<Repository<PermissionGroup>>;
  let userPermRepo: jest.Mocked<Repository<UserPermission>>;
  let auditLog: jest.Mocked<AuditLogService>;

  const mockDate = new Date('2025-01-15T10:00:00Z');

  const makePerm = (overrides: Partial<Permission> = {}): Permission =>
    ({
      id: 'perm-1',
      module: PermissionModule.BENEFICIARIES,
      action: PermissionAction.VIEW_ALL,
      displayName: 'beneficiaries:view_all',
      description: null,
      isSystem: true,
      sortOrder: 0,
      createdAt: mockDate,
      updatedAt: mockDate,
      ...overrides,
    }) as Permission;

  const makeRole = (overrides: Partial<Role> = {}): Role =>
    ({
      id: 'role-1',
      name: 'specialist',
      description: 'Specialist role',
      color: '#6B5B95',
      icon: null,
      isActive: true,
      isSystem: true,
      priority: 1,
      createdById: 'user-1',
      permissions: [makePerm()],
      createdAt: mockDate,
      updatedAt: mockDate,
      ...overrides,
    }) as Role;

  const makeGroup = (overrides: Partial<PermissionGroup> = {}): PermissionGroup =>
    ({
      id: 'group-1',
      name: 'Test Group',
      description: 'desc',
      color: '#2196F3',
      isActive: true,
      isSystem: false,
      createdById: 'user-1',
      permissions: [makePerm()],
      createdAt: mockDate,
      updatedAt: mockDate,
      ...overrides,
    }) as PermissionGroup;

  const makeUserPerm = (overrides: Partial<UserPermission> = {}): UserPermission =>
    ({
      id: 'up-1',
      userId: 'user-1',
      permissionId: 'perm-1',
      overrideType: OverrideType.GRANTED,
      grantedById: 'admin-1',
      expiresAt: null,
      roleId: null,
      permission: makePerm(),
      createdAt: mockDate,
      updatedAt: mockDate,
      ...overrides,
    }) as UserPermission;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: getRepositoryToken(Permission),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PermissionGroup),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserPermission),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(PermissionsService);
    permRepo = module.get(getRepositoryToken(Permission));
    roleRepo = module.get(getRepositoryToken(Role));
    groupRepo = module.get(getRepositoryToken(PermissionGroup));
    userPermRepo = module.get(getRepositoryToken(UserPermission));
    auditLog = module.get(AuditLogService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('seedPermissions', () => {
    it('should return existing count if permissions exist', async () => {
      permRepo.count.mockResolvedValue(50);
      const result = await service.seedPermissions();
      expect(result).toBe(50);
      expect(permRepo.save).not.toHaveBeenCalled();
    });

    it('should seed permissions if none exist', async () => {
      permRepo.count.mockResolvedValue(0);
      permRepo.create.mockReturnValue(makePerm());
      permRepo.save.mockResolvedValue([] as any);
      const result = await service.seedPermissions();
      expect(result).toBeDefined();
      expect(permRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAllPermissions', () => {
    it('should return all permissions ordered by module and sortOrder', async () => {
      const perms = [makePerm(), makePerm({ id: 'perm-2', action: PermissionAction.CREATE })];
      permRepo.find.mockResolvedValue(perms);
      const result = await service.findAllPermissions();
      expect(result).toEqual(perms);
      expect(permRepo.find).toHaveBeenCalledWith({
        order: { module: 'ASC', sortOrder: 'ASC' },
      });
    });

    it('should return empty array if no permissions', async () => {
      permRepo.find.mockResolvedValue([]);
      const result = await service.findAllPermissions();
      expect(result).toEqual([]);
    });
  });

  describe('findPermissionsByModule', () => {
    it('should group permissions by module', async () => {
      const perms = [
        makePerm({ id: 'p1', module: PermissionModule.BENEFICIARIES, action: PermissionAction.VIEW_ALL }),
        makePerm({ id: 'p2', module: PermissionModule.BENEFICIARIES, action: PermissionAction.CREATE }),
        makePerm({ id: 'p3', module: PermissionModule.APPOINTMENTS, action: PermissionAction.VIEW_ALL }),
      ];
      permRepo.find.mockResolvedValue(perms);
      const result = await service.findPermissionsByModule();
      expect(result['beneficiaries']).toHaveLength(2);
      expect(result['appointments']).toHaveLength(1);
    });

    it('should return empty object if no permissions', async () => {
      permRepo.find.mockResolvedValue([]);
      const result = await service.findPermissionsByModule();
      expect(result).toEqual({});
    });
  });

  describe('findAllRoles', () => {
    it('should return all roles with permissions', async () => {
      const roles = [makeRole()];
      roleRepo.find.mockResolvedValue(roles);
      const result = await service.findAllRoles();
      expect(result).toEqual(roles);
      expect(roleRepo.find).toHaveBeenCalledWith({
        relations: ['permissions'],
        order: { priority: 'ASC', name: 'ASC' },
      });
    });
  });

  describe('findRole', () => {
    it('should return a role by id', async () => {
      const role = makeRole();
      roleRepo.findOne.mockResolvedValue(role);
      const result = await service.findRole('role-1');
      expect(result).toEqual(role);
    });

    it('should throw NotFoundException if role not found', async () => {
      roleRepo.findOne.mockResolvedValue(null);
      await expect(service.findRole('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createRole', () => {
    it('should create a role with permissionIds', async () => {
      roleRepo.findOne.mockResolvedValueOnce(null);
      permRepo.findBy.mockResolvedValue([makePerm()]);
      roleRepo.create.mockReturnValue(makeRole());
      roleRepo.save.mockResolvedValue(makeRole());
      roleRepo.findOne.mockResolvedValueOnce(makeRole());

      const result = await service.createRole(
        { name: 'new_role', permissionIds: ['perm-1'] },
        'user-1',
      );
      expect(roleRepo.save).toHaveBeenCalled();
      expect(auditLog.log).toHaveBeenCalled();
    });

    it('should throw ConflictException if role name already exists', async () => {
      roleRepo.findOne.mockResolvedValueOnce(makeRole());
      await expect(
        service.createRole({ name: 'specialist', permissionIds: [] }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a role with groupId', async () => {
      roleRepo.findOne.mockResolvedValueOnce(null);
      groupRepo.findOne.mockResolvedValue(makeGroup());
      roleRepo.create.mockReturnValue(makeRole());
      roleRepo.save.mockResolvedValue(makeRole());
      roleRepo.findOne.mockResolvedValueOnce(makeRole());

      const result = await service.createRole(
        { name: 'new_role', groupId: 'group-1' },
        'user-1',
      );
      expect(groupRepo.findOne).toHaveBeenCalled();
    });

    it('should create a role with no permissions if groupId not found', async () => {
      roleRepo.findOne.mockResolvedValueOnce(null);
      groupRepo.findOne.mockResolvedValue(null);
      roleRepo.create.mockReturnValue(makeRole({ permissions: [] }));
      roleRepo.save.mockResolvedValue(makeRole({ permissions: [] }));
      roleRepo.findOne.mockResolvedValueOnce(makeRole({ permissions: [] }));

      await service.createRole({ name: 'new_role', groupId: 'nonexistent' }, 'user-1');
      expect(roleRepo.create).toHaveBeenCalled();
    });

    it('should use default color if not provided', async () => {
      roleRepo.findOne.mockResolvedValueOnce(null);
      permRepo.findBy.mockResolvedValue([]);
      roleRepo.create.mockReturnValue(makeRole());
      roleRepo.save.mockResolvedValue(makeRole());
      roleRepo.findOne.mockResolvedValueOnce(makeRole());

      await service.createRole({ name: 'new_role' }, 'user-1');
      expect(roleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ color: '#6B5B95' }),
      );
    });
  });

  describe('updateRole', () => {
    it('should update a role', async () => {
      const role = makeRole({ isSystem: false });
      roleRepo.findOne.mockResolvedValue(role);
      roleRepo.save.mockResolvedValue(role);
      roleRepo.findOne.mockResolvedValueOnce(role);

      const result = await service.updateRole(
        'role-1',
        { name: 'updated_name' },
        'user-1',
      );
      expect(roleRepo.save).toHaveBeenCalled();
      expect(auditLog.log).toHaveBeenCalled();
    });

    it('should throw BadRequestException when renaming a system role', async () => {
      const role = makeRole({ isSystem: true });
      roleRepo.findOne.mockResolvedValue(role);

      await expect(
        service.updateRole('role-1', { name: 'new_name' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow updating other fields on system role', async () => {
      const role = makeRole({ isSystem: true });
      roleRepo.findOne.mockResolvedValue(role);
      roleRepo.save.mockResolvedValue(role);
      roleRepo.findOne.mockResolvedValueOnce(role);

      await service.updateRole('role-1', { description: 'new desc' }, 'user-1');
      expect(roleRepo.save).toHaveBeenCalled();
    });

    it('should update permissionIds if provided', async () => {
      const role = makeRole();
      roleRepo.findOne.mockResolvedValue(role);
      permRepo.findBy.mockResolvedValue([makePerm({ id: 'perm-2' })]);
      roleRepo.save.mockResolvedValue(role);
      roleRepo.findOne.mockResolvedValueOnce(role);

      await service.updateRole('role-1', { permissionIds: ['perm-2'] }, 'user-1');
      expect(permRepo.findBy).toHaveBeenCalled();
    });
  });

  describe('duplicateRole', () => {
    it('should duplicate a role with "(نسخة)" suffix', async () => {
      const original = makeRole();
      const dup = makeRole({ id: 'role-2', name: 'specialist (نسخة)' });
      roleRepo.findOne
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce(dup);
      roleRepo.create.mockReturnValue(dup);
      roleRepo.save.mockResolvedValue(dup);

      const result = await service.duplicateRole('role-1', 'user-1');
      expect(roleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'specialist (نسخة)' }),
      );
      expect(auditLog.log).toHaveBeenCalled();
    });
  });

  describe('archiveRole', () => {
    it('should archive a non-system role', async () => {
      const role = makeRole({ isSystem: false, isActive: true });
      roleRepo.findOne.mockResolvedValue(role);
      roleRepo.save.mockResolvedValue(role);

      const result = await service.archiveRole('role-1', 'user-1');
      expect(role.isActive).toBe(false);
      expect(result).toEqual({ message: 'تم أرشفة الدور' });
    });

    it('should throw BadRequestException when archiving system role', async () => {
      const role = makeRole({ isSystem: true });
      roleRepo.findOne.mockResolvedValue(role);

      await expect(service.archiveRole('role-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteRole', () => {
    it('should delete a non-system role', async () => {
      const role = makeRole({ isSystem: false });
      roleRepo.findOne.mockResolvedValue(role);
      roleRepo.remove.mockResolvedValue(role);

      const result = await service.deleteRole('role-1', 'user-1');
      expect(roleRepo.remove).toHaveBeenCalledWith(role);
      expect(result).toEqual({ message: 'تم حذف الدور' });
    });

    it('should throw BadRequestException when deleting system role', async () => {
      const role = makeRole({ isSystem: true });
      roleRepo.findOne.mockResolvedValue(role);

      await expect(service.deleteRole('role-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('bulkAssignPermissions', () => {
    it('should bulk assign permissions to a role', async () => {
      const role = makeRole();
      roleRepo.findOne.mockResolvedValue(role);
      permRepo.findBy.mockResolvedValue([makePerm()]);
      roleRepo.save.mockResolvedValue(role);
      roleRepo.findOne.mockResolvedValueOnce(role);

      const result = await service.bulkAssignPermissions(
        { roleId: 'role-1', permissionIds: ['perm-1'] },
        'user-1',
      );
      expect(permRepo.findBy).toHaveBeenCalledWith({ id: In(['perm-1']) });
      expect(auditLog.log).toHaveBeenCalled();
    });
  });

  describe('compareRoles', () => {
    it('should throw BadRequestException if less than 2 ids', async () => {
      await expect(service.compareRoles(['role-1'])).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if some roles not found', async () => {
      roleRepo.find.mockResolvedValue([makeRole()]);
      await expect(service.compareRoles(['role-1', 'role-2'])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return comparison of roles', async () => {
      const r1 = makeRole({ id: 'role-1', name: 'Role 1', permissions: [makePerm()] });
      const r2 = makeRole({
        id: 'role-2',
        name: 'Role 2',
        permissions: [],
      });
      roleRepo.find.mockResolvedValue([r1, r2]);
      permRepo.find.mockResolvedValue([makePerm()]);

      const result = await service.compareRoles(['role-1', 'role-2']);
      expect(result).toHaveLength(2);
      expect(result[0].permissionCount).toBe(1);
      expect(result[1].permissionCount).toBe(0);
      expect(result[1].missingPermissions).toHaveLength(1);
    });
  });

  describe('getRoleStats', () => {
    it('should return role statistics', async () => {
      roleRepo.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8) // active
        .mockResolvedValueOnce(2); // system

      const mockQb: any = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '5' }),
      };
      roleRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getRoleStats();
      expect(result).toEqual({
        total: 10,
        active: 8,
        archived: 2,
        system: 2,
        withPermissions: 5,
      });
    });

    it('should handle null count from getRawOne', async () => {
      roleRepo.count.mockResolvedValue(0).mockResolvedValueOnce(0).mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      const mockQb: any = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };
      roleRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getRoleStats();
      expect(result.withPermissions).toBe(0);
    });
  });

  describe('findAllGroups', () => {
    it('should return all groups', async () => {
      const groups = [makeGroup()];
      groupRepo.find.mockResolvedValue(groups);
      const result = await service.findAllGroups();
      expect(result).toEqual(groups);
    });
  });

  describe('findGroup', () => {
    it('should return a group by id', async () => {
      groupRepo.findOne.mockResolvedValue(makeGroup());
      const result = await service.findGroup('group-1');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if group not found', async () => {
      groupRepo.findOne.mockResolvedValue(null);
      await expect(service.findGroup('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createGroup', () => {
    it('should create a group', async () => {
      groupRepo.findOne.mockResolvedValueOnce(null);
      permRepo.findBy.mockResolvedValue([makePerm()]);
      groupRepo.create.mockReturnValue(makeGroup());
      groupRepo.save.mockResolvedValue(makeGroup());
      groupRepo.findOne.mockResolvedValueOnce(makeGroup());

      const result = await service.createGroup(
        { name: 'New Group', permissionIds: ['perm-1'] },
        'user-1',
      );
      expect(auditLog.log).toHaveBeenCalled();
    });

    it('should throw ConflictException if group name exists', async () => {
      groupRepo.findOne.mockResolvedValueOnce(makeGroup());
      await expect(
        service.createGroup({ name: 'Test Group' }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should create group with empty permissions if no permissionIds', async () => {
      groupRepo.findOne.mockResolvedValueOnce(null);
      groupRepo.create.mockReturnValue(makeGroup({ permissions: [] }));
      groupRepo.save.mockResolvedValue(makeGroup({ permissions: [] }));
      groupRepo.findOne.mockResolvedValueOnce(makeGroup({ permissions: [] }));

      await service.createGroup({ name: 'Empty Group' }, 'user-1');
      expect(permRepo.findBy).not.toHaveBeenCalled();
    });
  });

  describe('updateGroup', () => {
    it('should update a group', async () => {
      const group = makeGroup();
      groupRepo.findOne.mockResolvedValue(group);
      groupRepo.save.mockResolvedValue(group);
      groupRepo.findOne.mockResolvedValueOnce(group);

      await service.updateGroup('group-1', { name: 'Updated' }, 'user-1');
      expect(groupRepo.save).toHaveBeenCalled();
    });

    it('should update permissionIds if provided', async () => {
      const group = makeGroup();
      groupRepo.findOne.mockResolvedValue(group);
      permRepo.findBy.mockResolvedValue([makePerm({ id: 'perm-2' })]);
      groupRepo.save.mockResolvedValue(group);
      groupRepo.findOne.mockResolvedValueOnce(group);

      await service.updateGroup('group-1', { permissionIds: ['perm-2'] }, 'user-1');
      expect(permRepo.findBy).toHaveBeenCalledWith({ id: In(['perm-2']) });
    });
  });

  describe('deleteGroup', () => {
    it('should delete a group', async () => {
      const group = makeGroup();
      groupRepo.findOne.mockResolvedValue(group);
      groupRepo.remove.mockResolvedValue(group);

      const result = await service.deleteGroup('group-1', 'user-1');
      expect(result).toEqual({ message: 'تم حذف المجموعة' });
      expect(auditLog.log).toHaveBeenCalled();
    });
  });

  describe('getUserEffectivePermissions', () => {
    it('should separate granted and denied overrides', async () => {
      const overrides = [
        makeUserPerm({ overrideType: OverrideType.GRANTED }),
        makeUserPerm({ id: 'up-2', overrideType: OverrideType.DENIED }),
      ];
      userPermRepo.find.mockResolvedValue(overrides);

      const result = await service.getUserEffectivePermissions('user-1');
      expect(result.granted).toHaveLength(1);
      expect(result.denied).toHaveLength(1);
    });

    it('should return empty arrays if no overrides', async () => {
      userPermRepo.find.mockResolvedValue([]);
      const result = await service.getUserEffectivePermissions('user-1');
      expect(result.granted).toHaveLength(0);
      expect(result.denied).toHaveLength(0);
    });
  });

  describe('setUserOverride', () => {
    it('should update existing override', async () => {
      const existing = makeUserPerm();
      userPermRepo.findOne.mockResolvedValue(existing);
      userPermRepo.save.mockResolvedValue(existing);
      permRepo.findOne.mockResolvedValue(makePerm());

      const result = await service.setUserOverride(
        {
          userId: 'user-1',
          permissionId: 'perm-1',
          overrideType: 'granted',
        },
        'admin-1',
      );
      expect(existing.overrideType).toBe('granted');
      expect(userPermRepo.save).toHaveBeenCalledWith(existing);
    });

    it('should create new override if none exists', async () => {
      userPermRepo.findOne.mockResolvedValueOnce(null);
      userPermRepo.create.mockReturnValue(makeUserPerm());
      userPermRepo.save.mockResolvedValue(makeUserPerm());
      permRepo.findOne.mockResolvedValue(makePerm());

      const result = await service.setUserOverride(
        {
          userId: 'user-1',
          permissionId: 'perm-1',
          overrideType: 'denied',
        },
        'admin-1',
      );
      expect(userPermRepo.create).toHaveBeenCalled();
    });

    it('should set expiresAt if provided', async () => {
      userPermRepo.findOne.mockResolvedValueOnce(null);
      userPermRepo.create.mockReturnValue(makeUserPerm());
      userPermRepo.save.mockResolvedValue(makeUserPerm());
      permRepo.findOne.mockResolvedValue(makePerm());

      await service.setUserOverride(
        {
          userId: 'user-1',
          permissionId: 'perm-1',
          overrideType: 'granted',
          expiresAt: '2025-12-31',
        },
        'admin-1',
      );
      expect(userPermRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ expiresAt: expect.any(Date) }),
      );
    });

    it('should handle permission not found gracefully', async () => {
      userPermRepo.findOne.mockResolvedValueOnce(null);
      userPermRepo.create.mockReturnValue(makeUserPerm());
      userPermRepo.save.mockResolvedValue(makeUserPerm());
      permRepo.findOne.mockResolvedValue(null);

      const result = await service.setUserOverride(
        {
          userId: 'user-1',
          permissionId: 'perm-nonexistent',
          overrideType: 'granted',
        },
        'admin-1',
      );
      expect(result).toEqual({ message: 'تم تحديث التجاوز' });
    });
  });

  describe('removeUserOverride', () => {
    it('should remove an existing override', async () => {
      const existing = makeUserPerm();
      userPermRepo.findOne.mockResolvedValue(existing);
      userPermRepo.remove.mockResolvedValue(existing);

      const result = await service.removeUserOverride('user-1', 'perm-1', 'admin-1');
      expect(result).toEqual({ message: 'تم إزالة التجاوز' });
      expect(auditLog.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException if override not found', async () => {
      userPermRepo.findOne.mockResolvedValue(null);
      await expect(
        service.removeUserOverride('user-1', 'perm-1', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('seedRolesFromMap', () => {
    it('should skip existing roles and create new ones', async () => {
      permRepo.find.mockResolvedValue([
        makePerm({ module: PermissionModule.BENEFICIARIES, action: PermissionAction.VIEW_ALL }),
      ]);
      roleRepo.findOne
        .mockResolvedValueOnce(makeRole({ name: 'super_admin' }))
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      roleRepo.create.mockReturnValue(makeRole());
      roleRepo.save.mockResolvedValue(makeRole());

      const result = await service.seedRolesFromMap('user-1');
      expect(result).toHaveLength(7);
    });
  });
});
