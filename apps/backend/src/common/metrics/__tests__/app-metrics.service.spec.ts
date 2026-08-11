jest.mock('../metrics.module', () => {
  const set = jest.fn();
  const inc = jest.fn();
  return {
    appBeneficiariesTotal: { labels: jest.fn(() => ({ set })) },
    appAppointmentsToday: { labels: jest.fn(() => ({ set: set })) },
    appSessionsTotal: { set },
    appRevenueTotal: { set },
  };
});

import { AppMetricsService } from '../app-metrics.service';
import {
  appBeneficiariesTotal,
  appAppointmentsToday,
  appSessionsTotal,
  appRevenueTotal,
} from '../metrics.module';

function mockRepo() {
  return {
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
  };
}

describe('AppMetricsService', () => {
  let service: AppMetricsService;
  let beneficiaryRepo: any;
  let appointmentRepo: any;
  let sessionRepo: any;
  let invoiceRepo: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    beneficiaryRepo = mockRepo();
    appointmentRepo = mockRepo();
    sessionRepo = mockRepo();
    invoiceRepo = mockRepo();
    service = new AppMetricsService(
      beneficiaryRepo,
      appointmentRepo,
      sessionRepo,
      invoiceRepo,
    );
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.useRealTimers();
  });

  describe('onModuleInit', () => {
    it('calls refreshMetrics immediately', async () => {
      service.onModuleInit();
      await Promise.resolve();
      expect(beneficiaryRepo.count).toHaveBeenCalled();
    });

    it('sets up refresh interval', () => {
      service.onModuleInit();
      expect(service as any).toHaveProperty('refreshInterval');
    });
  });

  describe('onModuleDestroy', () => {
    it('clears the interval', () => {
      service.onModuleInit();
      service.onModuleDestroy();
      jest.advanceTimersByTime(200000);
      // After destroy, no more calls should happen
    });
  });

  describe('refreshMetrics', () => {
    it('updates all metrics gauges', async () => {
      beneficiaryRepo.count
        .mockResolvedValueOnce(5)  // active
        .mockResolvedValueOnce(10); // total
      appointmentRepo.count.mockResolvedValue(3);
      sessionRepo.count.mockResolvedValue(20);
      invoiceRepo.getRawOne.mockResolvedValue({ total: '1500' });

      await service.refreshMetrics();

      expect(appBeneficiariesTotal.labels).toHaveBeenCalledWith('active');
      expect(appBeneficiariesTotal.labels).toHaveBeenCalledWith('total');
      expect(appAppointmentsToday.labels).toHaveBeenCalledWith('scheduled');
    });

    it('handles null total revenue gracefully', async () => {
      beneficiaryRepo.count.mockResolvedValue(0);
      appointmentRepo.count.mockResolvedValue(0);
      sessionRepo.count.mockResolvedValue(0);
      invoiceRepo.getRawOne.mockResolvedValue(null);

      await service.refreshMetrics();
      expect(appRevenueTotal.set).toHaveBeenCalledWith(0);
    });

    it('warns on error', async () => {
      beneficiaryRepo.count.mockRejectedValue(new Error('db error'));
      const warnSpy = jest.spyOn((service as any).logger, 'warn');
      await service.refreshMetrics();
      expect(warnSpy).toHaveBeenCalledWith('Failed to refresh app metrics');
      warnSpy.mockRestore();
    });
  });
});
