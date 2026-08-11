import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateRoleDto,
  UpdateRoleDto,
  CreatePermissionGroupDto,
  UpdatePermissionGroupDto,
  UserPermissionOverrideDto,
  BulkPermissionDto,
} from '../permission.dto';

describe('Permission DTOs', () => {
  describe('CreateRoleDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(CreateRoleDto, {
        name: 'Specialist',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without name', async () => {
      const dto = plainToInstance(CreateRoleDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept all optional fields', async () => {
      const dto = plainToInstance(CreateRoleDto, {
        name: 'Specialist',
        description: 'Therapy specialist',
        color: '#FF5733',
        icon: 'user-md',
        priority: 10,
        permissionIds: ['perm-1', 'perm-2'],
        groupId: 'group-1',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('UpdateRoleDto', () => {
    it('should pass with no data', async () => {
      const dto = plainToInstance(UpdateRoleDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept partial data', async () => {
      const dto = plainToInstance(UpdateRoleDto, {
        name: 'Updated Role',
        isActive: false,
        priority: 5,
        permissionIds: ['perm-1'],
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('CreatePermissionGroupDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(CreatePermissionGroupDto, {
        name: 'Clinical Staff',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without name', async () => {
      const dto = plainToInstance(CreatePermissionGroupDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept optional fields', async () => {
      const dto = plainToInstance(CreatePermissionGroupDto, {
        name: 'Clinical Staff',
        description: 'Group for clinical staff',
        color: '#4CAF50',
        permissionIds: ['perm-1', 'perm-2'],
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('UpdatePermissionGroupDto', () => {
    it('should pass with no data', async () => {
      const dto = plainToInstance(UpdatePermissionGroupDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept partial data', async () => {
      const dto = plainToInstance(UpdatePermissionGroupDto, {
        name: 'Updated Group',
        isActive: false,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('UserPermissionOverrideDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(UserPermissionOverrideDto, {
        userId: 'user-1',
        permissionId: 'perm-1',
        overrideType: 'granted',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without userId', async () => {
      const dto = plainToInstance(UserPermissionOverrideDto, {
        permissionId: 'perm-1',
        overrideType: 'granted',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without permissionId', async () => {
      const dto = plainToInstance(UserPermissionOverrideDto, {
        userId: 'user-1',
        overrideType: 'granted',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without overrideType', async () => {
      const dto = plainToInstance(UserPermissionOverrideDto, {
        userId: 'user-1',
        permissionId: 'perm-1',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept denied overrideType', async () => {
      const dto = plainToInstance(UserPermissionOverrideDto, {
        userId: 'user-1',
        permissionId: 'perm-1',
        overrideType: 'denied',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('BulkPermissionDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(BulkPermissionDto, {
        roleId: 'role-1',
        permissionIds: ['perm-1', 'perm-2'],
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without roleId', async () => {
      const dto = plainToInstance(BulkPermissionDto, {
        permissionIds: ['perm-1'],
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without permissionIds', async () => {
      const dto = plainToInstance(BulkPermissionDto, {
        roleId: 'role-1',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
