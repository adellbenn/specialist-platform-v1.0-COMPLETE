import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsService } from '../analytics.service';
import { Beneficiary, BeneficiaryStatus } from '@modules/beneficiaries/beneficiary.entity';
import { Appointment, AppointmentStatus } from '@modules/appointments/appointment.entity';
import { Session, AttendanceStatus } from '@modules/sessions/session.entity';
import { Report, ReportStatus } from '@modules/reports/report.entity';
import { Invoice, PaymentStatus } from '@modules/payments/invoice.entity';
import { Subscription, SubscriptionStatus } from '@modules/payments/subscription.entity';
import { User, UserRole } from '@modules/users/user.entity';
import { RedisService } from '@common/redis/redis.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let redisService: jest.Mocked<RedisService>;
  let beneficiaryRepo: jest.Mocked<Repository<Beneficiary>>;
  let appointmentRepo: jest.Mocked<Repository<Appointment>>;
  let sessionRepo: jest.Mocked<Repository<Session>>;
  let reportRepo: jest.Mocked<Repository<Report>>;
  let invoiceRepo: jest.Mocked<Repository<Invoice>>;
  let subscriptionRepo: jest.Mocked<Repository<Subscription>>;
  let userRepo: jest.Mocked<Repository<User>>;

  const tenantId = 'tenant-1';

  const createMockQb = (result: any = null) => {
    const qb: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(result),
      getCount: jest.fn().mockResolvedValue(0),
    };
    return qb;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(Beneficiary),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Appointment),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Session),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Report),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getJson: jest.fn().mockResolvedValue(null),
            setJson: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AnalyticsService);
    redisService = module.get(RedisService);
    beneficiaryRepo = module.get(getRepositoryToken(Beneficiary));
    appointmentRepo = module.get(getRepositoryToken(Appointment));
    sessionRepo = module.get(getRepositoryToken(Session));
    reportRepo = module.get(getRepositoryToken(Report));
    invoiceRepo = module.get(getRepositoryToken(Invoice));
    subscriptionRepo = module.get(getRepositoryToken(Subscription));
    userRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  describe('getDashboardStats', () => {
    it('should return cached data if available', async () => {
      const cachedData = { beneficiaries: { total: 10 } };
      redisService.getJson.mockResolvedValue(cachedData);

      const result = await service.getDashboardStats(tenantId);
      expect(result).toEqual(cachedData);
      expect(beneficiaryRepo.count).not.toHaveBeenCalled();
    });

    it('should compute dashboard stats when no cache', async () => {
      beneficiaryRepo.count.mockResolvedValue(10);
      sessionRepo.count.mockResolvedValue(50);
      appointmentRepo.count.mockResolvedValue(20);
      reportRepo.count.mockResolvedValue(5);
      subscriptionRepo.count.mockResolvedValue(8);
      userRepo.count.mockResolvedValue(3);

      const revenueQb = createMockQb({ total: '5000' });
      const monthRevenueQb = createMockQb({ total: '1000' });
      const expiringQb = createMockQb();

      invoiceRepo.createQueryBuilder
        .mockReturnValueOnce(revenueQb)
        .mockReturnValueOnce(monthRevenueQb);
      subscriptionRepo.createQueryBuilder.mockReturnValue(expiringQb);

      const result = await service.getDashboardStats(tenantId);
      expect(result).toBeDefined();
      expect(result.beneficiaries).toBeDefined();
      expect(result.sessions).toBeDefined();
      expect(result.appointments).toBeDefined();
      expect(result.financial).toBeDefined();
      expect(redisService.setJson).toHaveBeenCalled();
    });

    it('should handle zero sessions for attendance rate', async () => {
      beneficiaryRepo.count.mockResolvedValue(0);
      sessionRepo.count.mockResolvedValue(0);
      appointmentRepo.count.mockResolvedValue(0);
      reportRepo.count.mockResolvedValue(0);
      subscriptionRepo.count.mockResolvedValue(0);
      userRepo.count.mockResolvedValue(0);

      const revenueQb = createMockQb({ total: '0' });
      const monthRevenueQb = createMockQb({ total: '0' });
      const expiringQb = createMockQb();

      invoiceRepo.createQueryBuilder
        .mockReturnValueOnce(revenueQb)
        .mockReturnValueOnce(monthRevenueQb);
      subscriptionRepo.createQueryBuilder.mockReturnValue(expiringQb);

      const result = await service.getDashboardStats(tenantId);
      expect(result.sessions.attendanceRate).toBe(0);
    });
  });

  describe('getSpecialistStats', () => {
    it('should return specialist stats', async () => {
      beneficiaryRepo.count.mockResolvedValue(5);
      sessionRepo.count.mockResolvedValue(20);
      appointmentRepo.count.mockResolvedValue(3);

      const result = await service.getSpecialistStats('spec-1', tenantId);
      expect(result.myBeneficiaries).toBe(5);
      expect(result.mySessions).toBe(20);
      expect(result.mySessionsThisMonth).toBe(20);
      expect(result.pendingToday).toBe(3);
    });
  });

  describe('getAppointmentsTrend', () => {
    it('should return cached trend if available', async () => {
      const cached = [{ month: 'Jan', total: 10 }];
      redisService.getJson.mockResolvedValue(cached);

      const result = await service.getAppointmentsTrend(tenantId);
      expect(result).toEqual(cached);
    });

    it('should compute 6-month trend when no cache', async () => {
      appointmentRepo.count.mockResolvedValue(10);

      const result = await service.getAppointmentsTrend(tenantId);
      expect(result).toHaveLength(6);
      expect(redisService.setJson).toHaveBeenCalled();
    });
  });

  describe('getBeneficiariesByType', () => {
    it('should return beneficiaries grouped by case type', async () => {
      const mockQb: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { caseType: 'psychological', count: '30' },
          { caseType: 'speech', count: '20' },
        ]),
      };
      beneficiaryRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getBeneficiariesByType(tenantId);
      expect(result).toHaveLength(2);
    });
  });

  describe('getRevenueTrend', () => {
    it('should return cached revenue trend', async () => {
      const cached = [{ month: 'Jan', revenue: 5000 }];
      redisService.getJson.mockResolvedValue(cached);

      const result = await service.getRevenueTrend(tenantId);
      expect(result).toEqual(cached);
    });

    it('should compute 6-month revenue trend', async () => {
      const mockQb = createMockQb({ revenue: '1000' });
      invoiceRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getRevenueTrend(tenantId);
      expect(result).toHaveLength(6);
      expect(redisService.setJson).toHaveBeenCalled();
    });

    it('should default revenue to 0 when null', async () => {
      const mockQb = createMockQb({ revenue: null });
      invoiceRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getRevenueTrend(tenantId);
      expect(result[0].revenue).toBe(0);
    });
  });
});
