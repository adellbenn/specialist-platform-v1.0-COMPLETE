import { TenantsController } from '../tenants.controller';
import { BadRequestException } from '@nestjs/common';

describe('TenantsController', () => {
  let controller: TenantsController;
  let tenantsService: any;

  beforeEach(() => {
    tenantsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      toggleActive: jest.fn(),
      getStats: jest.fn(),
    };
    controller = new TenantsController(tenantsService);
  });

  describe('create', () => {
    it('should call tenantsService.create', async () => {
      const dto = { name: 'Amal Center', slug: 'amal-center' };
      const result = { id: 't-1', name: 'Amal Center' };
      tenantsService.create.mockResolvedValue(result);

      const response = await controller.create(dto as any);

      expect(tenantsService.create).toHaveBeenCalledWith(dto);
      expect(response).toEqual({ data: result, message: 'تم إنشاء المركز بنجاح' });
    });
  });

  describe('findAll', () => {
    it('should call tenantsService.findAll', async () => {
      const query = { page: 1, limit: 10 };
      const result = { data: [], total: 0 };
      tenantsService.findAll.mockResolvedValue(result);

      const response = await controller.findAll(query as any);

      expect(tenantsService.findAll).toHaveBeenCalledWith(query);
      expect(response).toBe(result);
    });
  });

  describe('findOne', () => {
    it('should call tenantsService.findOne', async () => {
      const result = { id: 't-1', name: 'Amal' };
      tenantsService.findOne.mockResolvedValue(result);

      const response = await controller.findOne('t-1');

      expect(tenantsService.findOne).toHaveBeenCalledWith('t-1');
      expect(response).toEqual({ data: result });
    });
  });

  describe('update', () => {
    it('should call tenantsService.update', async () => {
      const dto = { name: 'Updated Center' };
      const result = { id: 't-1', name: 'Updated Center' };
      tenantsService.update.mockResolvedValue(result);

      const response = await controller.update('t-1', dto as any);

      expect(tenantsService.update).toHaveBeenCalledWith('t-1', dto);
      expect(response).toEqual({ data: result, message: 'تم تعديل المركز بنجاح' });
    });
  });

  describe('toggleActive', () => {
    it('should return activated message when active', async () => {
      const result = { id: 't-1', isActive: true };
      tenantsService.toggleActive.mockResolvedValue(result);

      const response = await controller.toggleActive('t-1');

      expect(tenantsService.toggleActive).toHaveBeenCalledWith('t-1');
      expect(response).toEqual({ data: result, message: 'تم تفعيل المركز' });
    });

    it('should return deactivated message when inactive', async () => {
      const result = { id: 't-1', isActive: false };
      tenantsService.toggleActive.mockResolvedValue(result);

      const response = await controller.toggleActive('t-1');

      expect(response).toEqual({ data: result, message: 'تم تعطيل المركز' });
    });
  });

  describe('updateProfile', () => {
    it('should update tenant when user has tenantId', async () => {
      const dto = { name: 'Updated' };
      const user = { id: 'user-1', tenantId: 't-1' } as any;
      const result = { id: 't-1', name: 'Updated' };
      tenantsService.update.mockResolvedValue(result);

      const response = await controller.updateProfile(dto as any, user);

      expect(tenantsService.update).toHaveBeenCalledWith('t-1', dto);
      expect(response).toEqual({ data: result, message: 'تم تعديل بيانات المركز بنجاح' });
    });

    it('should throw BadRequestException when user has no tenantId', async () => {
      const user = { id: 'user-1', tenantId: null } as any;

      await expect(controller.updateProfile({} as any, user)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when tenantId is undefined', async () => {
      const user = { id: 'user-1' } as any;

      await expect(controller.updateProfile({} as any, user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStats', () => {
    it('should call tenantsService.getStats', async () => {
      const stats = { totalUsers: 10, totalBeneficiaries: 50 };
      tenantsService.getStats.mockResolvedValue(stats);

      const response = await controller.getStats('t-1');

      expect(tenantsService.getStats).toHaveBeenCalledWith('t-1');
      expect(response).toBe(stats);
    });
  });
});
