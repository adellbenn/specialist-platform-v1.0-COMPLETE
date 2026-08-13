import { ReportsController } from '../reports.controller';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: any;

beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      getStats: jest.fn(),
      toggleShare: jest.fn(),
      archive: jest.fn(),
      update: jest.fn(),
      submit: jest.fn(),
      approve: jest.fn(),
      findOne: jest.fn(),
    };
    controller = new ReportsController(service);
  });

  const mockUser = { id: 'user-1', role: 'specialist', tenantId: 'tenant-1' } as any;

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { beneficiaryId: 'ben-1', type: 'progress', title: 'Progress Report' };
      const result = { id: 'rpt-1' };
      service.create.mockResolvedValue(result);

      const response = await controller.create(dto as any, 'tenant-1', mockUser);

      expect(service.create).toHaveBeenCalledWith(dto, 'tenant-1', 'user-1');
      expect(response).toEqual({ data: result, message: 'تم إنشاء التقرير بنجاح' });
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      const result = { data: [], total: 0 };
      service.findAll.mockResolvedValue(result);

      const response = await controller.findAll({} as any, 'tenant-1', mockUser);

      expect(service.findAll).toHaveBeenCalledWith({}, 'tenant-1', mockUser);
      expect(response).toBe(result);
    });
  });

  describe('getStats', () => {
    it('should call service.getStats', async () => {
      const stats = { total: 30, drafts: 5 };
      service.getStats.mockResolvedValue(stats);

      const response = await controller.getStats('tenant-1');

      expect(service.getStats).toHaveBeenCalledWith('tenant-1');
      expect(response).toEqual({ data: stats });
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      const result = { id: 'rpt-1', title: 'Report' };
      service.findOne.mockResolvedValue(result);

      const response = await controller.findOne('rpt-1', 'tenant-1', mockUser);

      expect(service.findOne).toHaveBeenCalledWith('rpt-1', 'tenant-1', mockUser);
      expect(response).toEqual({ data: result });
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const dto = { title: 'Updated Report' };
      const result = { id: 'rpt-1', title: 'Updated Report' };
      service.update.mockResolvedValue(result);

      const response = await controller.update('rpt-1', dto as any, 'tenant-1', mockUser);

      expect(service.update).toHaveBeenCalledWith('rpt-1', dto, 'tenant-1', mockUser);
      expect(response).toEqual({ data: result, message: 'تم تعديل التقرير بنجاح' });
    });
  });

  describe('submit', () => {
    it('should call service.submit', async () => {
      const result = { id: 'rpt-1', status: 'submitted' };
      service.submit.mockResolvedValue(result);

      const response = await controller.submit('rpt-1', 'tenant-1', mockUser);

      expect(service.submit).toHaveBeenCalledWith('rpt-1', 'tenant-1', mockUser);
      expect(response).toEqual({ data: result, message: 'تم تقديم التقرير للمراجعة' });
    });
  });

  describe('approve', () => {
    it('should call service.approve', async () => {
      const dto = { notes: 'Looks good' };
      const result = { id: 'rpt-1', status: 'approved' };
      service.approve.mockResolvedValue(result);

      const response = await controller.approve('rpt-1', dto as any, 'tenant-1', mockUser);

      expect(service.approve).toHaveBeenCalledWith('rpt-1', dto, 'tenant-1', 'user-1');
      expect(response).toEqual({ data: result, message: 'تم الموافقة على التقرير' });
    });
  });

  describe('toggleShare', () => {
    it('should call service.toggleShare and return shared message', async () => {
      const result = { id: 'rpt-1', sharedWithBeneficiary: true };
      service.toggleShare.mockResolvedValue(result);

      const response = await controller.toggleShare('rpt-1', 'tenant-1', mockUser);

      expect(service.toggleShare).toHaveBeenCalledWith('rpt-1', 'tenant-1', mockUser);
      expect(response).toEqual({ data: result, message: 'تم مشاركة التقرير مع المستفيد' });
    });

    it('should return unshared message when toggled off', async () => {
      const result = { id: 'rpt-1', sharedWithBeneficiary: false };
      service.toggleShare.mockResolvedValue(result);

      const response = await controller.toggleShare('rpt-1', 'tenant-1', mockUser);

      expect(response).toEqual({ data: result, message: 'تم إلغاء المشاركة' });
    });
  });

  describe('archive', () => {
    it('should call service.archive', async () => {
      service.archive.mockResolvedValue(undefined);

      const response = await controller.archive('rpt-1', 'tenant-1', mockUser);

      expect(service.archive).toHaveBeenCalledWith('rpt-1', 'tenant-1', mockUser);
      expect(response).toEqual({ message: 'تم أرشفة التقرير' });
    });
  });
});
