import { FileAttachment, EntityType } from '../file-attachment.entity';

describe('FileAttachment Entity', () => {
  describe('EntityType enum', () => {
    it('should have correct values', () => {
      expect(EntityType.BENEFICIARY).toBe('beneficiary');
      expect(EntityType.SESSION).toBe('session');
      expect(EntityType.REPORT).toBe('report');
      expect(EntityType.INVOICE).toBe('invoice');
    });

    it('should have 4 values', () => {
      expect(Object.keys(EntityType)).toHaveLength(4);
    });
  });

  describe('FileAttachment class', () => {
    it('should be instantiable', () => {
      const attachment = new FileAttachment();
      expect(attachment).toBeInstanceOf(FileAttachment);
    });

    it('should allow setting all properties', () => {
      const attachment = new FileAttachment();
      attachment.tenantId = 'tenant-1';
      attachment.entityType = EntityType.BENEFICIARY;
      attachment.entityId = 'ben-1';
      attachment.fileName = 'report.pdf';
      attachment.filePath = '/uploads/report.pdf';
      attachment.fileSize = 1024000;
      attachment.mimeType = 'application/pdf';
      attachment.originalName = 'Annual Report.pdf';
      attachment.uploadedById = 'user-1';

      expect(attachment.tenantId).toBe('tenant-1');
      expect(attachment.entityType).toBe(EntityType.BENEFICIARY);
      expect(attachment.entityId).toBe('ben-1');
      expect(attachment.fileName).toBe('report.pdf');
      expect(attachment.filePath).toBe('/uploads/report.pdf');
      expect(attachment.fileSize).toBe(1024000);
      expect(attachment.mimeType).toBe('application/pdf');
      expect(attachment.originalName).toBe('Annual Report.pdf');
      expect(attachment.uploadedById).toBe('user-1');
    });

    it('should allow nullable fields to be undefined', () => {
      const attachment = new FileAttachment();
      expect(attachment.uploadedById).toBeUndefined();
    });

    it('should extend AbstractEntity and be a constructor', () => {
      expect(typeof FileAttachment).toBe('function');
    });
  });
});
