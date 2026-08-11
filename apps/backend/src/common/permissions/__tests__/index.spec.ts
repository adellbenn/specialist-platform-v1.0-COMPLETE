import * as perms from '../index';

describe('common/permissions/index', () => {
  it('exports Permission enum', () => {
    expect(perms.Permission).toBeDefined();
    expect(perms.Permission.DASHBOARD_VIEW).toBe('dashboard:view');
  });

  it('exports ROLE_PERMISSIONS', () => {
    expect(perms.ROLE_PERMISSIONS).toBeDefined();
    expect(perms.ROLE_PERMISSIONS.super_admin).toBeDefined();
  });

  it('exports RoleKey type', () => {
    expect(perms).toHaveProperty('ROLE_PERMISSIONS');
  });

  it('exports roleHasPermission function', () => {
    expect(typeof perms.roleHasPermission).toBe('function');
  });

  it('exports getPermissionsForRole function', () => {
    expect(typeof perms.getPermissionsForRole).toBe('function');
  });

  it('exports DISABLED_ROLES set', () => {
    expect(perms.DISABLED_ROLES).toBeDefined();
    expect(perms.DISABLED_ROLES.has('accountant')).toBe(true);
  });

  it('roleHasPermission works for super_admin', () => {
    expect(perms.roleHasPermission('super_admin', perms.Permission.DASHBOARD_VIEW)).toBe(true);
  });

  it('getPermissionsForRole returns array for valid role', () => {
    const perms2 = perms.getPermissionsForRole('specialist');
    expect(Array.isArray(perms2)).toBe(true);
    expect(perms2.length).toBeGreaterThan(0);
  });

  it('getPermissionsForRole returns empty for disabled role', () => {
    const perms3 = perms.getPermissionsForRole('accountant');
    expect(perms3).toEqual([]);
  });
});
