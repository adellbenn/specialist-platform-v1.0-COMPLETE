import { BeneficiariesController } from '../beneficiaries.controller';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@modules/users/user.entity';

describe('BeneficiariesController', () => {
  let controller: BeneficiariesController;
  let service: any;

  beforeEach(() => {
    service = {
      findOne: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      assignSpecialist: jest.fn(),
      changeStatus: jest.fn(),
      archive: jest.fn(),
      getStats: jest.fn(),
      getFile: jest.fn(),
      updateFile: jest.fn(),
    };
    controller = new BeneficiariesController(service);
  });

  const mockUser = { id: 'user-1', role: 'specialist', tenantId: 'tenant-1' } as any;
  const mockBeneficiaryUser = { id: 'user-2', role: UserRole.BENEFICIARY, tenantId: 'tenant-1' } as any;

  describe('getMyProfile', () => {
    it('should return profile when beneficiaryId exists', async () => {
      const profile = { id: 'ben-1', firstName: 'Ahmed' };
      service.findOne.mockResolvedValue(profile);

      const response = await controller.getMyProfile(mockUser, 'tenant-1', 'ben-1');

      expect(service.findOne).toHaveBeenCalledWith('ben-1', 'tenant-1', mockUser);
      expect(response).toEqual({ data: profile });
    });

    it('should return null when no beneficiaryId', async () => {
      const response = await controller.getMyProfile(mockUser, 'tenant-1', undefined as any);

      expect(response).toEqual({ data: null, message: 'لا يوجد ملف مرتبط بهذا الحساب' });
      expect(service.findOne).not.toHaveBeenCalled();
    });
  });

  describe('updateMyProfile', () => {
    it('should filter allowed fields and call service.update', async () => {
      const dto = { phone: '0555555555', firstName: 'Hacked' } as any;
      const result = { id: 'ben-1', phone: '0555555555' };
      service.update.mockResolvedValue(result);

      const response = await controller.updateMyProfile(dto, mockUser, 'tenant-1', 'ben-1');

      expect(service.update).toHaveBeenCalledWith(
        'ben-1',
        expect.objectContaining({ phone: '0555555555' }),
        'tenant-1',
        mockUser,
      );
      expect(response).toEqual({ data: result, message: 'تم تحديث بياناتك بنجاح' });
    });
  });

  describe('getStats', () => {
    it('should call service.getStats', async () => {
      const stats = { total: 50 };
      service.getStats.mockResolvedValue(stats);

      const response = await controller.getStats('tenant-1');

      expect(service.getStats).toHaveBeenCalledWith('tenant-1');
      expect(response).toEqual({ data: stats });
    });
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { firstName: 'Ahmed', lastName: 'Ali', caseType: 'psychological' };
      const result = { id: 'ben-1' };
      service.create.mockResolvedValue(result);

      const response = await controller.create(dto as any, 'tenant-1', mockUser);

      expect(service.create).toHaveBeenCalledWith(dto, 'tenant-1', 'user-1');
      expect(response).toEqual({ data: result, message: 'تم إنشاء ملف المستفيد بنجاح' });
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      const query = {};
      const result = { data: [], total: 0 };
      service.findAll.mockResolvedValue(result);

      const response = await controller.findAll(query as any, 'tenant-1', mockUser);

      expect(service.findAll).toHaveBeenCalledWith(query, 'tenant-1', mockUser);
      expect(response).toBe(result);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne for staff', async () => {
      const result = { id: 'ben-1' };
      service.findOne.mockResolvedValue(result);

      const response = await controller.findOne('ben-1', 'tenant-1', mockUser, undefined as any);

      expect(service.findOne).toHaveBeenCalledWith('ben-1', 'tenant-1', mockUser);
      expect(response).toEqual({ data: result });
    });

    it('should throw ForbiddenException when beneficiary tries to view another', async () => {
      await expect(
        controller.findOne('ben-other', 'tenant-1', mockBeneficiaryUser, 'ben-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow beneficiary to view own profile', async () => {
      const result = { id: 'ben-1' };
      service.findOne.mockResolvedValue(result);

      const response = await controller.findOne('ben-1', 'tenant-1', mockBeneficiaryUser, 'ben-1');

      expect(response).toEqual({ data: result });
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const dto = { firstName: 'Updated' };
      const result = { id: 'ben-1', firstName: 'Updated' };
      service.update.mockResolvedValue(result);

      const response = await controller.update('ben-1', dto as any, 'tenant-1', mockUser);

      expect(service.update).toHaveBeenCalledWith('ben-1', dto, 'tenant-1', mockUser);
      expect(response).toEqual({ data: result, message: 'تم تعديل بيانات المستفيد بنجاح' });
    });
  });

  describe('assignSpecialist', () => {
    it('should call service.assignSpecialist', async () => {
      const dto = { specialistId: 'spec-1' };
      const result = { id: 'ben-1', assignedSpecialistId: 'spec-1' };
      service.assignSpecialist.mockResolvedValue(result);

      const response = await controller.assignSpecialist('ben-1', dto as any, 'tenant-1');

      expect(service.assignSpecialist).toHaveBeenCalledWith('ben-1', dto, 'tenant-1');
      expect(response).toEqual({ data: result, message: 'تم تعيين الأخصائي بنجاح' });
    });
  });

  describe('changeStatus', () => {
    it('should call service.changeStatus', async () => {
      const result = { id: 'ben-1', status: 'inactive' };
      service.changeStatus.mockResolvedValue(result);

      const response = await controller.changeStatus('ben-1', 'inactive' as any, 'tenant-1');

      expect(service.changeStatus).toHaveBeenCalledWith('ben-1', 'inactive', 'tenant-1');
      expect(response).toEqual({ data: result, message: 'تم تعديل الحالة بنجاح' });
    });
  });

  describe('archive', () => {
    it('should call service.archive', async () => {
      service.archive.mockResolvedValue(undefined);

      const response = await controller.archive('ben-1', 'tenant-1');

      expect(service.archive).toHaveBeenCalledWith('ben-1', 'tenant-1');
      expect(response).toEqual({ message: 'تم أرشفة المستفيد بنجاح' });
    });
  });

  describe('getFile', () => {
    it('should call service.getFile for staff', async () => {
      const file = { beneficiaryId: 'ben-1', diagnosis: [] };
      service.getFile.mockResolvedValue(file);

      const response = await controller.getFile('ben-1', 'tenant-1', mockUser, undefined as any);

      expect(service.getFile).toHaveBeenCalledWith('ben-1', 'tenant-1');
      expect(response).toEqual({ data: file });
    });

    it('should throw ForbiddenException when beneficiary tries to view another file', async () => {
      await expect(
        controller.getFile('ben-other', 'tenant-1', mockBeneficiaryUser, 'ben-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateFile', () => {
    it('should call service.updateFile', async () => {
      const dto = { medicalHistory: 'Updated history' };
      const result = { id: 'bf-1', medicalHistory: 'Updated history' };
      service.updateFile.mockResolvedValue(result);

      const response = await controller.updateFile('ben-1', dto as any, 'tenant-1', mockUser);

      expect(service.updateFile).toHaveBeenCalledWith('ben-1', dto, 'tenant-1', 'user-1');
      expect(response).toEqual({ data: result, message: 'تم تعديل الملف الإلكتروني بنجاح' });
    });
  });
});
