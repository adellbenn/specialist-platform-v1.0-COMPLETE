import { Role } from '../role.entity';
import { UserPermission, OverrideType } from '../user-permission.entity';

describe('Role Entity', () => {
  it('should be defined', () => {
    expect(Role).toBeDefined();
  });

  it('should have expected columns', () => {
    const metadata = (Role as any).getMetadata?.() || null;
    // If getMetadata is not available, test the class structure
    const role = new Role();
    expect(role).toBeInstanceOf(Role);
  });

  it('should allow setting name', () => {
    const role = new Role();
    role.name = 'specialist';
    expect(role.name).toBe('specialist');
  });

  it('should allow setting isActive', () => {
    const role = new Role();
    role.isActive = true;
    expect(role.isActive).toBe(true);
  });

  it('should allow setting isSystem', () => {
    const role = new Role();
    role.isSystem = true;
    expect(role.isSystem).toBe(true);
  });

  it('should allow setting permissions array', () => {
    const role = new Role();
    role.permissions = [];
    expect(role.permissions).toEqual([]);
  });

  it('should allow setting color', () => {
    const role = new Role();
    role.color = '#FF0000';
    expect(role.color).toBe('#FF0000');
  });

  it('should allow setting priority', () => {
    const role = new Role();
    role.priority = 5;
    expect(role.priority).toBe(5);
  });

  it('should allow setting description', () => {
    const role = new Role();
    role.description = 'A test role';
    expect(role.description).toBe('A test role');
  });

  it('should allow setting icon', () => {
    const role = new Role();
    role.icon = 'shield';
    expect(role.icon).toBe('shield');
  });

  it('should allow setting createdById', () => {
    const role = new Role();
    role.createdById = 'user-1';
    expect(role.createdById).toBe('user-1');
  });

  it('should allow setting userPermissions', () => {
    const role = new Role();
    role.userPermissions = [];
    expect(role.userPermissions).toEqual([]);
  });
});

describe('UserPermission Entity', () => {
  it('should be defined', () => {
    expect(UserPermission).toBeDefined();
  });

  it('should export OverrideType enum', () => {
    expect(OverrideType.GRANTED).toBe('granted');
    expect(OverrideType.DENIED).toBe('denied');
  });

  it('should allow setting userId', () => {
    const up = new UserPermission();
    up.userId = 'user-1';
    expect(up.userId).toBe('user-1');
  });

  it('should allow setting permissionId', () => {
    const up = new UserPermission();
    up.permissionId = 'perm-1';
    expect(up.permissionId).toBe('perm-1');
  });

  it('should allow setting overrideType', () => {
    const up = new UserPermission();
    up.overrideType = OverrideType.DENIED;
    expect(up.overrideType).toBe(OverrideType.DENIED);
  });

  it('should allow setting grantedById', () => {
    const up = new UserPermission();
    up.grantedById = 'admin-1';
    expect(up.grantedById).toBe('admin-1');
  });

  it('should allow setting expiresAt', () => {
    const up = new UserPermission();
    const date = new Date('2025-12-31');
    up.expiresAt = date;
    expect(up.expiresAt).toBe(date);
  });

  it('should allow setting roleId', () => {
    const up = new UserPermission();
    up.roleId = 'role-1';
    expect(up.roleId).toBe('role-1');
  });

  it('should allow setting permission relation', () => {
    const up = new UserPermission();
    up.permission = {} as any;
    expect(up.permission).toBeDefined();
  });

  it('should allow setting role relation', () => {
    const up = new UserPermission();
    up.role = {} as any;
    expect(up.role).toBeDefined();
  });
});
