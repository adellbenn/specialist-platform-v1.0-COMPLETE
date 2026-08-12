import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchService } from '../search.service';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';
import { Appointment } from '@modules/appointments/appointment.entity';
import { Report } from '@modules/reports/report.entity';
import { Invoice } from '@modules/payments/invoice.entity';
import { User, UserRole } from '@modules/users/user.entity';

describe('SearchService', () => {
  let service: SearchService;
  let beneficiaryRepo: jest.Mocked<Repository<Beneficiary>>;
  let appointmentRepo: jest.Mocked<Repository<Appointment>>;
  let reportRepo: jest.Mocked<Repository<Report>>;
  let invoiceRepo: jest.Mocked<Repository<Invoice>>;
  let userRepo: jest.Mocked<Repository<User>>;

  const tenantId = 'tenant-1';

  const makeQb = (items: any[] = []) => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(items),
    };
    return qb;
  };

  const adminUser = {
    id: 'admin-1',
    tenantId,
    role: UserRole.CENTER_MANAGER,
    firstName: 'Admin',
    lastName: 'User',
  } as User;

  const specialistUser = {
    id: 'spec-1',
    tenantId,
    role: UserRole.SPECIALIST,
    firstName: 'Dr.',
    lastName: 'Specialist',
  } as User;

  const beneficiaryUser = {
    id: 'user-1',
    tenantId,
    role: UserRole.BENEFICIARY,
    beneficiaryId: 'ben-1',
    firstName: 'Ahmed',
    lastName: 'Ali',
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: getRepositoryToken(Beneficiary),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Appointment),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Report),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SearchService);
    beneficiaryRepo = module.get(getRepositoryToken(Beneficiary));
    appointmentRepo = module.get(getRepositoryToken(Appointment));
    reportRepo = module.get(getRepositoryToken(Report));
    invoiceRepo = module.get(getRepositoryToken(Invoice));
    userRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  describe('search', () => {
    it('should return empty for query shorter than 2 chars', async () => {
      const result = await service.search('a', tenantId, adminUser);
      expect(result.results).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should return empty for null/undefined query', async () => {
      const result = await service.search('', tenantId, adminUser);
      expect(result.results).toHaveLength(0);
    });

    it('should return empty for whitespace-only query', async () => {
      const result = await service.search('   ', tenantId, adminUser);
      expect(result.results).toHaveLength(0);
    });

    it('should search across all entity types for admin', async () => {
      beneficiaryRepo.createQueryBuilder.mockReturnValue(makeQb([
        { id: 'b1', firstName: 'Ahmed', lastName: 'Ali', fileNumber: 'BNF-00001', status: 'active' },
      ]));
      appointmentRepo.createQueryBuilder.mockReturnValue(makeQb([
        {
          id: 'a1',
          beneficiary: { firstName: 'Ahmed', lastName: 'Ali', fileNumber: 'BNF-00001' },
          scheduledAt: new Date(),
          status: 'scheduled',
        },
      ]));
      reportRepo.createQueryBuilder.mockReturnValue(makeQb([
        {
          id: 'r1',
          title: 'Progress Report',
          beneficiary: { firstName: 'Ahmed', lastName: 'Ali', fileNumber: 'BNF-00001' },
          status: 'draft',
        },
      ]));
      invoiceRepo.createQueryBuilder.mockReturnValue(makeQb([
        {
          id: 'i1',
          invoiceNumber: 'INV-001',
          beneficiary: { firstName: 'Ahmed', lastName: 'Ali', fileNumber: 'BNF-00001' },
          paymentStatus: 'paid',
        },
      ]));
      userRepo.createQueryBuilder.mockReturnValue(makeQb([
        { id: 'u1', firstName: 'Dr. Sara', lastName: 'Ahmed', email: 'sara@test.com', role: 'specialist' },
      ]));

      const result = await service.search('Ahmed', tenantId, adminUser);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.total).toBe(result.results.length);
    });

    it('should not search users for specialist role', async () => {
      beneficiaryRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      appointmentRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      reportRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      invoiceRepo.createQueryBuilder.mockReturnValue(makeQb([]));

      await service.search('Ahmed', tenantId, specialistUser);
      expect(userRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should not search users for beneficiary role', async () => {
      beneficiaryRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      appointmentRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      reportRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      invoiceRepo.createQueryBuilder.mockReturnValue(makeQb([]));

      await service.search('Ahmed', tenantId, beneficiaryUser);
      expect(userRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should not search invoices for specialist', async () => {
      beneficiaryRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      appointmentRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      reportRepo.createQueryBuilder.mockReturnValue(makeQb([]));

      await service.search('Ahmed', tenantId, specialistUser);
      expect(invoiceRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should not search invoices for beneficiary', async () => {
      beneficiaryRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      appointmentRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      reportRepo.createQueryBuilder.mockReturnValue(makeQb([]));

      await service.search('Ahmed', tenantId, beneficiaryUser);
      expect(invoiceRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('searchBeneficiaries', () => {
    it('should return mapped beneficiary results', async () => {
      beneficiaryRepo.createQueryBuilder.mockReturnValue(makeQb([
        {
          id: 'b1',
          firstName: 'Ahmed',
          lastName: 'Ali',
          fileNumber: 'BNF-00001',
          status: 'active',
        },
      ]));

      const result = await service.searchBeneficiaries('Ahmed', tenantId, adminUser, 5);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('beneficiary');
      expect(result[0].title).toBe('Ahmed Ali');
      expect(result[0].link).toBe('/dashboard/beneficiaries/b1');
    });

    it('should restrict specialist to own beneficiaries', async () => {
      beneficiaryRepo.createQueryBuilder.mockReturnValue(makeQb([]));

      await service.searchBeneficiaries('Ahmed', tenantId, specialistUser, 5);
      expect(beneficiaryRepo.createQueryBuilder).toHaveBeenCalled();
      const qb = beneficiaryRepo.createQueryBuilder.mock.results[0].value;
      expect(qb.andWhere).toHaveBeenCalledWith('b.assigned_specialist_id = :sid', {
        sid: specialistUser.id,
      });
    });
  });

  describe('report search results mapping', () => {
    it('should map report results correctly', async () => {
      beneficiaryRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      appointmentRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      reportRepo.createQueryBuilder.mockReturnValue(makeQb([
        {
          id: 'r1',
          title: 'Progress Report',
          beneficiary: { firstName: 'Ahmed', lastName: 'Ali', fileNumber: 'BNF-00001' },
          status: 'approved',
        },
      ]));
      invoiceRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      userRepo.createQueryBuilder.mockReturnValue(makeQb([]));

      const result = await service.search('Progress', tenantId, adminUser);
      const reportResult = result.results.find((r) => r.type === 'report');
      expect(reportResult).toBeDefined();
      expect(reportResult?.title).toBe('Progress Report');
      expect(reportResult?.link).toBe('/dashboard/reports/r1');
    });
  });

  describe('invoice search results mapping', () => {
    it('should map invoice results correctly', async () => {
      beneficiaryRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      appointmentRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      reportRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      invoiceRepo.createQueryBuilder.mockReturnValue(makeQb([
        {
          id: 'i1',
          invoiceNumber: 'INV-001',
          beneficiary: { firstName: 'Ahmed', lastName: 'Ali', fileNumber: 'BNF-00001' },
          paymentStatus: 'paid',
        },
      ]));
      userRepo.createQueryBuilder.mockReturnValue(makeQb([]));

      const result = await service.search('INV', tenantId, adminUser);
      const invoiceResult = result.results.find((r) => r.type === 'invoice');
      expect(invoiceResult).toBeDefined();
      expect(invoiceResult?.title).toBe('فاتورة #INV-001');
    });
  });

  describe('user search results mapping', () => {
    it('should map user results correctly', async () => {
      beneficiaryRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      appointmentRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      reportRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      invoiceRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      userRepo.createQueryBuilder.mockReturnValue(makeQb([
        { id: 'u1', firstName: 'Sara', lastName: 'Ahmed', email: 'sara@test.com', role: 'specialist' },
      ]));

      const result = await service.search('Sara', tenantId, adminUser);
      const userResult = result.results.find((r) => r.type === 'user');
      expect(userResult).toBeDefined();
      expect(userResult?.title).toBe('Sara Ahmed');
      expect(userResult?.subtitle).toBe('sara@test.com');
    });
  });

  describe('beneficiary search restrictions', () => {
    it('should restrict beneficiary search to own data', async () => {
      beneficiaryRepo.createQueryBuilder.mockReturnValue(makeQb([]));

      await service.searchBeneficiaries('test', tenantId, beneficiaryUser, 5);
      // Beneficiary has role BENEFICIARY, no specialist filter applied
      const qb = beneficiaryRepo.createQueryBuilder.mock.results[0].value;
      expect(qb.andWhere).not.toHaveBeenCalledWith('b.assigned_specialist_id = :sid', expect.anything());
      // ...but is restricted to their own beneficiary record
      expect(qb.andWhere).toHaveBeenCalledWith('b.id = :bid', { bid: 'ben-1' });
    });

    it('should return empty when beneficiary has no linked record', async () => {
      const orphan = { ...beneficiaryUser, beneficiaryId: null } as unknown as User;
      beneficiaryRepo.createQueryBuilder.mockReturnValue(makeQb([]));

      const result = await service.searchBeneficiaries('test', tenantId, orphan, 5);
      expect(result).toEqual([]);
      expect(beneficiaryRepo.createQueryBuilder).toHaveBeenCalled();
    });

    it('should restrict beneficiary appointment search to own records', async () => {
      beneficiaryRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      appointmentRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      reportRepo.createQueryBuilder.mockReturnValue(makeQb([]));
      invoiceRepo.createQueryBuilder.mockReturnValue(makeQb([]));

      await service.search('Ahmed', tenantId, beneficiaryUser);
      const qb = appointmentRepo.createQueryBuilder.mock.results[0].value;
      expect(qb.andWhere).toHaveBeenCalledWith('a.beneficiary_id = :bid', { bid: 'ben-1' });
    });
  });
});
