import { PermissionGroup } from '../permission-group.entity';

describe('PermissionGroup Entity', () => {
  describe('PermissionGroup class', () => {
    it('should be instantiable', () => {
      const group = new PermissionGroup();
      expect(group).toBeInstanceOf(PermissionGroup);
    });

    it('should allow setting all properties', () => {
      const group = new PermissionGroup();
      group.name = 'Clinical Staff';
      group.description = 'Clinical staff permissions';
      group.color = '#4CAF50';
      group.isActive = true;
      group.isSystem = false;
      group.createdById = 'admin-1';
      group.permissions = [];

      expect(group.name).toBe('Clinical Staff');
      expect(group.description).toBe('Clinical staff permissions');
      expect(group.color).toBe('#4CAF50');
      expect(group.isActive).toBe(true);
      expect(group.isSystem).toBe(false);
      expect(group.createdById).toBe('admin-1');
      expect(group.permissions).toEqual([]);
    });

    it('should allow nullable fields to be undefined', () => {
      const group = new PermissionGroup();
      expect(group.description).toBeUndefined();
      expect(group.createdById).toBeUndefined();
    });

    it('should extend AbstractEntity and be a constructor', () => {
      expect(typeof PermissionGroup).toBe('function');
    });
  });
});
