import { FilesController } from '../files.controller';
import { BadRequestException } from '@nestjs/common';
import { EntityType } from '../file-attachment.entity';

describe('FilesController', () => {
  let controller: FilesController;
  let service: any;

  beforeEach(() => {
    service = {
      upload: jest.fn(),
      getEntityFiles: jest.fn(),
      findAll: jest.fn(),
      getFilePath: jest.fn(),
      delete: jest.fn(),
    };
    controller = new FilesController(service);
  });

  const mockUser = { id: 'user-1', role: 'specialist' } as any;

  describe('upload', () => {
    it('should call service.upload with correct params', async () => {
      const file = { originalname: 'test.pdf', size: 1024 } as Express.Multer.File;
      const result = { id: 'f-1', fileName: 'test.pdf' };
      service.upload.mockResolvedValue(result);

      const response = await controller.upload(
        file, EntityType.BENEFICIARY, 'ben-1', 'tenant-1', mockUser,
      );

      expect(service.upload).toHaveBeenCalledWith(file, EntityType.BENEFICIARY, 'ben-1', 'tenant-1', 'user-1');
      expect(response).toEqual({ data: result, message: 'تم رفع الملف بنجاح' });
    });

    it('should throw BadRequestException for invalid entityType', async () => {
      await expect(
        controller.upload({} as any, 'invalid' as any, 'ben-1', 'tenant-1', mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when entityId is missing', async () => {
      await expect(
        controller.upload({} as any, EntityType.BENEFICIARY, '' as any, 'tenant-1', mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getEntityFiles', () => {
    it('should call service.getEntityFiles when entityType and entityId provided', async () => {
      const files = [{ id: 'f-1' }];
      service.getEntityFiles.mockResolvedValue(files);

      const response = await controller.getEntityFiles(
        'tenant-1', EntityType.BENEFICIARY, 'ben-1', 1, 24, undefined,
      );

      expect(service.getEntityFiles).toHaveBeenCalledWith(EntityType.BENEFICIARY, 'ben-1', 'tenant-1');
      expect(response).toEqual({ data: files });
    });

    it('should call service.findAll when no entityType/entityId', async () => {
      const result = { data: [], total: 0 };
      service.findAll.mockResolvedValue(result);

      const response = await controller.getEntityFiles(
        'tenant-1', undefined, undefined, 1, 24, undefined,
      );

      expect(service.findAll).toHaveBeenCalledWith('tenant-1', { page: 1, limit: 24, mimeType: undefined });
      expect(response).toBe(result);
    });

    it('should pass mimeType filter', async () => {
      const result = { data: [], total: 0 };
      service.findAll.mockResolvedValue(result);

      await controller.getEntityFiles(
        'tenant-1', undefined, undefined, 1, 24, 'application/pdf',
      );

      expect(service.findAll).toHaveBeenCalledWith('tenant-1', { page: 1, limit: 24, mimeType: 'application/pdf' });
    });
  });

  describe('download', () => {
    it('should set headers and send file', async () => {
      const file = { mimeType: 'application/pdf', originalName: 'report.pdf' };
      const absolutePath = '/uploads/report.pdf';
      service.getFilePath.mockResolvedValue({ file, absolutePath });

      const res = {
        setHeader: jest.fn(),
        sendFile: jest.fn(),
      } as any;

      await controller.download('f-1', 'tenant-1', res, mockUser);

      expect(service.getFilePath).toHaveBeenCalledWith('f-1', 'tenant-1', mockUser);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('report.pdf'),
      );
      expect(res.sendFile).toHaveBeenCalledWith(absolutePath);
    });
  });

  describe('delete', () => {
    it('should call service.delete', async () => {
      service.delete.mockResolvedValue(undefined);

      const response = await controller.delete('f-1', 'tenant-1');

      expect(service.delete).toHaveBeenCalledWith('f-1', 'tenant-1');
      expect(response).toEqual({ message: 'تم حذف الملف بنجاح' });
    });
  });
});
