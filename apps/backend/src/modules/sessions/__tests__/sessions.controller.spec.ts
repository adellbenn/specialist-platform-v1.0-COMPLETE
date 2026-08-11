import { SessionsController } from '../sessions.controller';

describe('SessionsController', () => {
  let controller: SessionsController;
  let service: any;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      getStats: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };
    controller = new SessionsController(service);
  });

  const mockUser = { id: 'user-1', role: 'specialist', tenantId: 'tenant-1' } as any;

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { beneficiaryId: 'ben-1', specialistId: 'spec-1', startedAt: '2026-06-15T10:00:00' };
      const result = { id: 'sess-1' };
      service.create.mockResolvedValue(result);

      const response = await controller.create(dto as any, 'tenant-1');

      expect(service.create).toHaveBeenCalledWith(dto, 'tenant-1');
      expect(response).toEqual({ data: result, message: 'تم تسجيل الجلسة بنجاح' });
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

  describe('getStats', () => {
    it('should call service.getStats', async () => {
      const stats = { total: 25 };
      service.getStats.mockResolvedValue(stats);

      const response = await controller.getStats('tenant-1');

      expect(service.getStats).toHaveBeenCalledWith('tenant-1');
      expect(response).toEqual({ data: stats });
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      const session = { id: 'sess-1' };
      service.findOne.mockResolvedValue(session);

      const response = await controller.findOne('sess-1', 'tenant-1', mockUser);

      expect(service.findOne).toHaveBeenCalledWith('sess-1', 'tenant-1', mockUser);
      expect(response).toEqual({ data: session });
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const dto = { sessionNotes: 'Updated notes' };
      const result = { id: 'sess-1', sessionNotes: 'Updated notes' };
      service.update.mockResolvedValue(result);

      const response = await controller.update('sess-1', dto as any, 'tenant-1', mockUser);

      expect(service.update).toHaveBeenCalledWith('sess-1', dto, 'tenant-1', mockUser);
      expect(response).toEqual({ data: result, message: 'تم تعديل الجلسة بنجاح' });
    });
  });
});
