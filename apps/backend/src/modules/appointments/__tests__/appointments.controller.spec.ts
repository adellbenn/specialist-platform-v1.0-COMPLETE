import { AppointmentsController } from '../appointments.controller';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let service: any;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      getCalendarData: jest.fn(),
      getTodayAppointments: jest.fn(),
      getStats: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      confirm: jest.fn(),
      cancel: jest.fn(),
      markNoShow: jest.fn(),
      complete: jest.fn(),
    };
    controller = new AppointmentsController(service);
  });

  const mockUser = { id: 'user-1', role: 'specialist', tenantId: 'tenant-1' } as any;

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { beneficiaryId: 'ben-1', specialistId: 'spec-1', scheduledAt: '2026-06-15T10:00:00' };
      const result = { id: 'apt-1' };
      service.create.mockResolvedValue(result);

      const response = await controller.create(dto as any, 'tenant-1', mockUser);

      expect(service.create).toHaveBeenCalledWith(dto, 'tenant-1', 'user-1');
      expect(response).toEqual({ data: result, message: 'تم إنشاء الموعد بنجاح' });
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

  describe('getCalendar', () => {
    it('should call service.getCalendarData with parsed year/month', async () => {
      const result: any[] = [];
      service.getCalendarData.mockResolvedValue(result);

      const response = await controller.getCalendar(
        '2026', '6', 'tenant-1', mockUser,
        undefined, undefined, undefined, undefined, undefined,
      );

      expect(service.getCalendarData).toHaveBeenCalledWith(2026, 6, 'tenant-1', mockUser, {});
      expect(response).toEqual({ data: result });
    });

    it('should default to current year/month when invalid', async () => {
      service.getCalendarData.mockResolvedValue([]);
      const now = new Date();

      await controller.getCalendar(
        'invalid', 'invalid', 'tenant-1', mockUser,
      );

      expect(service.getCalendarData).toHaveBeenCalledWith(
        now.getFullYear(),
        now.getMonth() + 1,
        'tenant-1',
        mockUser,
        {},
      );
    });

    it('should include filters when provided', async () => {
      service.getCalendarData.mockResolvedValue([]);

      await controller.getCalendar(
        '2026', '6', 'tenant-1', mockUser,
        'spec-1', 'ben-1', 'scheduled', undefined, undefined,
      );

      expect(service.getCalendarData).toHaveBeenCalledWith(
        2026, 6, 'tenant-1', mockUser,
        { specialistId: 'spec-1', beneficiaryId: 'ben-1', status: 'scheduled' },
      );
    });
  });

  describe('getToday', () => {
    it('should pass specialistId when user is specialist', async () => {
      service.getTodayAppointments.mockResolvedValue([]);

      const response = await controller.getToday('tenant-1', mockUser);

      expect(service.getTodayAppointments).toHaveBeenCalledWith('tenant-1', 'user-1');
      expect(response).toEqual({ data: [] });
    });

    it('should pass undefined specialistId when user is not specialist', async () => {
      service.getTodayAppointments.mockResolvedValue([]);
      const adminUser = { ...mockUser, role: 'center_manager' };

      await controller.getToday('tenant-1', adminUser);

      expect(service.getTodayAppointments).toHaveBeenCalledWith('tenant-1', undefined);
    });
  });

  describe('getStats', () => {
    it('should call service.getStats', async () => {
      const stats = { total: 10 };
      service.getStats.mockResolvedValue(stats);

      const response = await controller.getStats('tenant-1');

      expect(service.getStats).toHaveBeenCalledWith('tenant-1');
      expect(response).toEqual({ data: stats });
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      const apt = { id: 'apt-1' };
      service.findOne.mockResolvedValue(apt);

      const response = await controller.findOne('apt-1', 'tenant-1', mockUser);

      expect(service.findOne).toHaveBeenCalledWith('apt-1', 'tenant-1', mockUser);
      expect(response).toEqual({ data: apt });
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const dto = { notes: 'Updated' };
      const result = { id: 'apt-1', notes: 'Updated' };
      service.update.mockResolvedValue(result);

      const response = await controller.update('apt-1', dto as any, 'tenant-1');

      expect(service.update).toHaveBeenCalledWith('apt-1', dto, 'tenant-1');
      expect(response).toEqual({ data: result, message: 'تم تعديل الموعد بنجاح' });
    });
  });

  describe('confirm', () => {
    it('should call service.confirm', async () => {
      const result = { id: 'apt-1', status: 'confirmed' };
      service.confirm.mockResolvedValue(result);

      const response = await controller.confirm('apt-1', 'tenant-1');

      expect(service.confirm).toHaveBeenCalledWith('apt-1', 'tenant-1');
      expect(response).toEqual({ data: result, message: 'تم تأكيد الموعد' });
    });
  });

  describe('cancel', () => {
    it('should call service.cancel with reason', async () => {
      const result = { id: 'apt-1', status: 'cancelled' };
      service.cancel.mockResolvedValue(result);

      const response = await controller.cancel('apt-1', 'Patient request', 'tenant-1');

      expect(service.cancel).toHaveBeenCalledWith('apt-1', 'Patient request', 'tenant-1');
      expect(response).toEqual({ data: result, message: 'تم إلغاء الموعد' });
    });
  });

  describe('markNoShow', () => {
    it('should call service.markNoShow', async () => {
      const result = { id: 'apt-1', status: 'no_show' };
      service.markNoShow.mockResolvedValue(result);

      const response = await controller.markNoShow('apt-1', 'tenant-1');

      expect(service.markNoShow).toHaveBeenCalledWith('apt-1', 'tenant-1');
      expect(response).toEqual({ data: result, message: 'تم تسجيل عدم الحضور' });
    });
  });

  describe('complete', () => {
    it('should call service.complete', async () => {
      const sessionDto = { sessionNotes: 'Good session' };
      const result = { id: 'sess-1' };
      service.complete.mockResolvedValue(result);

      const response = await controller.complete('apt-1', sessionDto as any, 'tenant-1', mockUser);

      expect(service.complete).toHaveBeenCalledWith('apt-1', sessionDto, 'tenant-1', 'user-1');
      expect(response).toEqual({ data: result, message: 'تم تسجيل الجلسة بنجاح' });
    });
  });
});
