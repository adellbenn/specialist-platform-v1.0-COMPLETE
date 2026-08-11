import { AnalyticsController } from '../analytics.controller';
import { UserRole } from '@modules/users/user.entity';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: any;

  beforeEach(() => {
    service = {
      getDashboardStats: jest.fn(),
      getSpecialistStats: jest.fn(),
      getAppointmentsTrend: jest.fn(),
      getBeneficiariesByType: jest.fn(),
      getRevenueTrend: jest.fn(),
    };
    controller = new AnalyticsController(service);
  });

  describe('getDashboard', () => {
    it('should return stats for non-specialist user', async () => {
      const stats = { totalBeneficiaries: 50 };
      service.getDashboardStats.mockResolvedValue(stats);
      const user = { id: 'user-1', role: 'center_manager' } as any;

      const response = await controller.getDashboard('tenant-1', user);

      expect(service.getDashboardStats).toHaveBeenCalledWith('tenant-1');
      expect(response).toEqual({ data: stats });
      expect(service.getSpecialistStats).not.toHaveBeenCalled();
    });

    it('should include specialist stats when user is specialist', async () => {
      const stats = { totalBeneficiaries: 50 };
      const specialistStats = { myBeneficiaries: 10, mySessions: 25 };
      service.getDashboardStats.mockResolvedValue(stats);
      service.getSpecialistStats.mockResolvedValue(specialistStats);
      const user = { id: 'user-1', role: UserRole.SPECIALIST } as any;

      const response = await controller.getDashboard('tenant-1', user);

      expect(service.getDashboardStats).toHaveBeenCalledWith('tenant-1');
      expect(service.getSpecialistStats).toHaveBeenCalledWith('user-1', 'tenant-1');
      expect(response).toEqual({ data: { ...stats, specialist: specialistStats } });
    });
  });

  describe('getAppointmentsTrend', () => {
    it('should call service.getAppointmentsTrend', async () => {
      const result = [{ month: '2026-01', count: 20 }];
      service.getAppointmentsTrend.mockResolvedValue(result);

      const response = await controller.getAppointmentsTrend('tenant-1');

      expect(service.getAppointmentsTrend).toHaveBeenCalledWith('tenant-1');
      expect(response).toEqual({ data: result });
    });
  });

  describe('getBeneficiariesByType', () => {
    it('should call service.getBeneficiariesByType', async () => {
      const result = [{ type: 'psychological', count: 30 }];
      service.getBeneficiariesByType.mockResolvedValue(result);

      const response = await controller.getBeneficiariesByType('tenant-1');

      expect(service.getBeneficiariesByType).toHaveBeenCalledWith('tenant-1');
      expect(response).toEqual({ data: result });
    });
  });

  describe('getRevenueTrend', () => {
    it('should call service.getRevenueTrend', async () => {
      const result = [{ month: '2026-01', revenue: 5000 }];
      service.getRevenueTrend.mockResolvedValue(result);

      const response = await controller.getRevenueTrend('tenant-1');

      expect(service.getRevenueTrend).toHaveBeenCalledWith('tenant-1');
      expect(response).toEqual({ data: result });
    });
  });
});
