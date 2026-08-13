import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FilesService } from '../files.service';
import { FileAttachment, EntityType } from '../file-attachment.entity';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';
import { Report } from '@modules/reports/report.entity';
import { Session } from '@modules/sessions/session.entity';
import { VirusScannerService } from '@common/security/virus-scanner.service';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('FilesService', () => {
  let service: FilesService;
  let fileRepo: jest.Mocked<Repository<FileAttachment>>;
  let configService: jest.Mocked<ConfigService>;
  let virusScanner: jest.Mocked<VirusScannerService>;
  const fsMock = fs as jest.Mocked<typeof fs>;

  const tenantId = 'tenant-1';

  const makeFile = (overrides: Partial<FileAttachment> = {}): FileAttachment =>
    ({
      id: 'file-1',
      tenantId,
      entityType: EntityType.BENEFICIARY,
      entityId: 'ben-1',
      fileName: 'abc123.pdf',
      filePath: `${tenantId}/beneficiary/2025-06/abc123.pdf`,
      fileSize: 1024,
      mimeType: 'application/pdf',
      originalName: 'document.pdf',
      uploadedById: 'user-1',
      uploadedBy: { id: 'user-1', firstName: 'Admin', lastName: 'User' } as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as FileAttachment;

  const mockMulterFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File =>
    ({
      fieldname: 'file',
      originalname: 'document.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 1024,
      destination: '',
      filename: 'document.pdf',
      path: '',
      buffer: Buffer.from('test'),
      stream: null as any,
      ...overrides,
    }) as Express.Multer.File;

  beforeEach(async () => {
    fsMock.mkdirSync.mockImplementation(() => undefined as any);
    fsMock.existsSync.mockReturnValue(true);
    fsMock.writeFileSync.mockImplementation(() => {});
    fsMock.unlinkSync.mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: getRepositoryToken(FileAttachment),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Beneficiary),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Report),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Session),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('./uploads'),
          },
        },
        {
          provide: VirusScannerService,
          useValue: {
            scanBuffer: jest.fn().mockResolvedValue({ clean: true }),
          },
        },
      ],
    }).compile();

    service = module.get(FilesService);
    fileRepo = module.get(getRepositoryToken(FileAttachment));
    configService = module.get(ConfigService);
    virusScanner = module.get(VirusScannerService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('upload', () => {
    it('should upload a valid file', async () => {
      fileRepo.create.mockReturnValue(makeFile());
      fileRepo.save.mockResolvedValue(makeFile());

      const result = await service.upload(
        mockMulterFile(),
        EntityType.BENEFICIARY,
        'ben-1',
        tenantId,
        'user-1',
      );
      expect(result).toBeDefined();
      expect(fsMock.writeFileSync).toHaveBeenCalled();
      expect(fileRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for null file', async () => {
      await expect(
        service.upload(null as any, EntityType.BENEFICIARY, 'ben-1', tenantId, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for oversized file', async () => {
      const bigFile = mockMulterFile({ size: 20 * 1024 * 1024 });
      await expect(
        service.upload(bigFile, EntityType.BENEFICIARY, 'ben-1', tenantId, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for disallowed mime type', async () => {
      const badFile = mockMulterFile({ mimetype: 'application/x-executable' });
      await expect(
        service.upload(badFile, EntityType.BENEFICIARY, 'ben-1', tenantId, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject file with virus', async () => {
      virusScanner.scanBuffer.mockResolvedValue({ clean: false, virus: 'EICAR' });
      await expect(
        service.upload(mockMulterFile(), EntityType.BENEFICIARY, 'ben-1', tenantId, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should proceed if virus scan has error', async () => {
      virusScanner.scanBuffer.mockResolvedValue({ clean: true, error: 'scanner down' });
      fileRepo.create.mockReturnValue(makeFile());
      fileRepo.save.mockResolvedValue(makeFile());

      const result = await service.upload(
        mockMulterFile(),
        EntityType.BENEFICIARY,
        'ben-1',
        tenantId,
        'user-1',
      );
      expect(result).toBeDefined();
    });

    it('should allow image mime types', async () => {
      fileRepo.create.mockReturnValue(makeFile({ mimeType: 'image/png' }));
      fileRepo.save.mockResolvedValue(makeFile({ mimeType: 'image/png' }));

      const imgFile = mockMulterFile({ mimetype: 'image/png' });
      const result = await service.upload(imgFile, EntityType.BENEFICIARY, 'ben-1', tenantId, 'user-1');
      expect(result).toBeDefined();
    });

    it('should allow word documents', async () => {
      fileRepo.create.mockReturnValue(makeFile({ mimeType: 'application/msword' }));
      fileRepo.save.mockResolvedValue(makeFile({ mimeType: 'application/msword' }));

      const docFile = mockMulterFile({ mimetype: 'application/msword' });
      await service.upload(docFile, EntityType.BENEFICIARY, 'ben-1', tenantId, 'user-1');
      expect(fileRepo.save).toHaveBeenCalled();
    });
  });

  describe('getEntityFiles', () => {
    it('should return files for an entity', async () => {
      fileRepo.find.mockResolvedValue([makeFile()]);
      const result = await service.getEntityFiles(EntityType.BENEFICIARY, 'ben-1', tenantId);
      expect(result).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('should return paginated files', async () => {
      fileRepo.findAndCount.mockResolvedValue([[makeFile()], 1]);
      const result = await service.findAll(tenantId);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by mimeType', async () => {
      fileRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.findAll(tenantId, { mimeType: 'application/pdf' });
      expect(fileRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ mimeType: 'application/pdf' }),
        }),
      );
    });
  });

  describe('getFilePath', () => {
    it('should return file path', async () => {
      fileRepo.findOne.mockResolvedValue(makeFile());
      fsMock.existsSync.mockReturnValue(true);

      const result = await service.getFilePath('file-1', tenantId);
      expect(result.absolutePath).toBeDefined();
    });

    it('should throw NotFoundException if file not found in DB', async () => {
      fileRepo.findOne.mockResolvedValue(null);
      await expect(service.getFilePath('nonexistent', tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if file not on disk', async () => {
      fileRepo.findOne.mockResolvedValue(makeFile());
      fsMock.existsSync.mockReturnValue(false);

      await expect(service.getFilePath('file-1', tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a file', async () => {
      fileRepo.findOne.mockResolvedValue(makeFile());
      fsMock.existsSync.mockReturnValue(true);
      fileRepo.remove.mockResolvedValue(makeFile());

      await service.delete('file-1', tenantId);
      expect(fsMock.unlinkSync).toHaveBeenCalled();
      expect(fileRepo.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if file not found', async () => {
      fileRepo.findOne.mockResolvedValue(null);
      await expect(service.delete('nonexistent', tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle file not existing on disk gracefully', async () => {
      fileRepo.findOne.mockResolvedValue(makeFile());
      fsMock.existsSync.mockReturnValue(false);
      fileRepo.remove.mockResolvedValue(makeFile());

      await service.delete('file-1', tenantId);
      expect(fsMock.unlinkSync).not.toHaveBeenCalled();
      expect(fileRepo.remove).toHaveBeenCalled();
    });
  });
});
