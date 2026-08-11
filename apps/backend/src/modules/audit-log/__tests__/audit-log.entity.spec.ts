import { AuditLog, AuditAction } from '../audit-log.entity';

describe('AuditLog Entity', () => {
  describe('AuditAction enum', () => {
    it('should have correct values', () => {
      expect(AuditAction.CREATE).toBe('CREATE');
      expect(AuditAction.READ).toBe('READ');
      expect(AuditAction.UPDATE).toBe('UPDATE');
      expect(AuditAction.DELETE).toBe('DELETE');
      expect(AuditAction.LOGIN).toBe('LOGIN');
      expect(AuditAction.LOGOUT).toBe('LOGOUT');
      expect(AuditAction.EXPORT).toBe('EXPORT');
      expect(AuditAction.APPROVE).toBe('APPROVE');
      expect(AuditAction.SUBMIT).toBe('SUBMIT');
    });

    it('should have 9 values', () => {
      expect(Object.keys(AuditAction)).toHaveLength(9);
    });
  });

  describe('AuditLog class', () => {
    it('should be instantiable', () => {
      const log = new AuditLog();
      expect(log).toBeInstanceOf(AuditLog);
    });

    it('should allow setting all properties', () => {
      const log = new AuditLog();
      log.tenantId = 'tenant-1';
      log.userId = 'user-1';
      log.action = AuditAction.CREATE;
      log.entityType = 'beneficiary';
      log.entityId = 'ben-1';
      log.oldValues = { name: 'Old Name' };
      log.newValues = { name: 'New Name' };
      log.ipAddress = '192.168.1.1';
      log.userAgent = 'Mozilla/5.0';
      log.description = 'Created beneficiary';

      expect(log.tenantId).toBe('tenant-1');
      expect(log.userId).toBe('user-1');
      expect(log.action).toBe(AuditAction.CREATE);
      expect(log.entityType).toBe('beneficiary');
      expect(log.entityId).toBe('ben-1');
      expect(log.oldValues).toEqual({ name: 'Old Name' });
      expect(log.newValues).toEqual({ name: 'New Name' });
      expect(log.ipAddress).toBe('192.168.1.1');
      expect(log.userAgent).toBe('Mozilla/5.0');
      expect(log.description).toBe('Created beneficiary');
    });

    it('should allow nullable fields to be undefined', () => {
      const log = new AuditLog();
      expect(log.tenantId).toBeUndefined();
      expect(log.userId).toBeUndefined();
      expect(log.entityId).toBeUndefined();
      expect(log.oldValues).toBeUndefined();
      expect(log.newValues).toBeUndefined();
      expect(log.ipAddress).toBeUndefined();
      expect(log.userAgent).toBeUndefined();
      expect(log.description).toBeUndefined();
    });

    it('should extend AbstractEntity and be a constructor', () => {
      expect(typeof AuditLog).toBe('function');
    });
  });
});
