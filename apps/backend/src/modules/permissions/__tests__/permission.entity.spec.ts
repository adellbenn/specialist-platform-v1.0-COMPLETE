import { getAllModuleActions, PermissionModule, PermissionAction } from '../permission.entity';
import { Permission } from '@common/permissions/permissions.enum';

describe('Permission Entity', () => {
  describe('getAllModuleActions', () => {
    it('should return all module-action combinations', () => {
      const result = getAllModuleActions();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should have module, action, and key for each entry', () => {
      const result = getAllModuleActions();
      for (const entry of result) {
        expect(entry.module).toBeDefined();
        expect(entry.action).toBeDefined();
        expect(entry.key).toBe(`${entry.module}:${entry.action}`);
      }
    });

    it('should include DASHBOARD module actions', () => {
      const result = getAllModuleActions();
      const dashboardPerms = result.filter((r) => r.module === PermissionModule.DASHBOARD);
      expect(dashboardPerms.length).toBeGreaterThanOrEqual(3);
      expect(dashboardPerms.map((p) => p.action)).toContain(PermissionAction.VIEW);
      expect(dashboardPerms.map((p) => p.action)).toContain(PermissionAction.STATS);
      expect(dashboardPerms.map((p) => p.action)).toContain(PermissionAction.PERFORMANCE);
    });

    it('should include BENEFICIARIES module actions', () => {
      const result = getAllModuleActions();
      const benPerms = result.filter((r) => r.module === PermissionModule.BENEFICIARIES);
      expect(benPerms.length).toBeGreaterThanOrEqual(5);
      expect(benPerms.map((p) => p.action)).toContain(PermissionAction.VIEW_ALL);
      expect(benPerms.map((p) => p.action)).toContain(PermissionAction.CREATE);
      expect(benPerms.map((p) => p.action)).toContain(PermissionAction.DELETE);
    });

    it('should include APPOINTMENTS module actions', () => {
      const result = getAllModuleActions();
      const aptPerms = result.filter((r) => r.module === PermissionModule.APPOINTMENTS);
      expect(aptPerms.length).toBeGreaterThanOrEqual(4);
      expect(aptPerms.map((p) => p.action)).toContain(PermissionAction.CANCEL);
      expect(aptPerms.map((p) => p.action)).toContain(PermissionAction.CONFIRM);
    });

    it('should include SESSIONS module actions', () => {
      const result = getAllModuleActions();
      const sessPerms = result.filter((r) => r.module === PermissionModule.SESSIONS);
      expect(sessPerms.length).toBeGreaterThanOrEqual(3);
    });

    it('should include REPORTS module actions', () => {
      const result = getAllModuleActions();
      const reportPerms = result.filter((r) => r.module === PermissionModule.REPORTS);
      expect(reportPerms.length).toBeGreaterThanOrEqual(4);
      expect(reportPerms.map((p) => p.action)).toContain(PermissionAction.APPROVE);
    });

    it('should include PAYMENTS module actions', () => {
      const result = getAllModuleActions();
      const payPerms = result.filter((r) => r.module === PermissionModule.PAYMENTS);
      expect(payPerms.length).toBeGreaterThanOrEqual(3);
      expect(payPerms.map((p) => p.action)).toContain(PermissionAction.REFUND);
    });

    it('should include PERMISSIONS module actions', () => {
      const result = getAllModuleActions();
      const permPerms = result.filter((r) => r.module === PermissionModule.PERMISSIONS);
      expect(permPerms.length).toBeGreaterThanOrEqual(3);
      expect(permPerms.map((p) => p.action)).toContain(PermissionAction.OVERRIDE);
      expect(permPerms.map((p) => p.action)).toContain(PermissionAction.AUDIT);
    });

    it('should include all PermissionModule values', () => {
      const result = getAllModuleActions();
      const modules = new Set(result.map((r) => r.module));
      for (const mod of Object.values(PermissionModule)) {
        expect(modules.has(mod)).toBe(true);
      }
    });

    it('should produce unique keys', () => {
      const result = getAllModuleActions();
      const keys = result.map((r) => r.key);
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    });

    it('should cover every Permission registry key exactly (RBAC invariant)', () => {
      const result = getAllModuleActions();
      const keySet = new Set(result.map((r) => r.key));
      const registryKeys = Object.values(Permission);
      const missing = registryKeys.filter((key) => !keySet.has(key));
      expect(missing).toEqual([]);
    });
  });
});
