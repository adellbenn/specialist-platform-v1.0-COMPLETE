import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ReportsService } from '../reports.service';
import { Report, ReportStatus, ReportType } from '../report.entity';
import { User, UserRole } from '@modules/users/user.entity';

describe('ReportsService', () => {
  let service: ReportsService;
  let reportRepo: jest.Mocked<Repository<Report>>;

  const tenantId = 'tenant-1';

  const makeReport = (overrides: Partial<Report> = {}): Report =>
    ({
      id: 'rpt-1',
      tenantId,
      beneficiaryId: 'ben-1',
      specialistId: 'spec-1',
      type: ReportType.PROGRESS,
      title: 'Progress Report',
      periodFrom: new Date('2025-01-01'),
      periodTo: new Date('2025-03-31'),
      content: { summary: 'Test summary' },
      recommendations: null,
      status: ReportStatus.DRAFT,
      sharedWithBeneficiary: false,
      approvedById: null,
      approvedAt: null,
      beneficiary: { id: 'ben-1', firstName: 'Ahmed', lastName: 'Ali', fileNumber: 'BNF-00001' } as any,
      specialist: { id: 'spec-1', firstName: 'Dr.', lastName: 'Sara' } as any,
      approvedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Report;

  const makeUser = (role: UserRole = UserRole.CENTER_MANAGER): User =>
    ({
      id: 'spec-1',
      tenantId,
      role,
      firstName: 'Dr.',
      lastName: 'Sara',
      beneficiaryId: null,
    }) as unknown as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Report),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ReportsService);
    reportRepo = module.get(getRepositoryToken(Report));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create a report', async () => {
      reportRepo.create.mockReturnValue(makeReport());
      reportRepo.save.mockResolvedValue(makeReport());
      reportRepo.findOne.mockResolvedValue(makeReport());

      const result = await service.create(
        {
          beneficiaryId: 'ben-1',
          type: ReportType.PROGRESS,
          title: 'Progress Report',
        } as any,
        tenantId,
        'spec-1',
      );
      expect(result).toBeDefined();
      expect(reportRepo.save).toHaveBeenCalled();
    });

    it('should set content to empty object if null', async () => {
      reportRepo.create.mockReturnValue(makeReport());
      reportRepo.save.mockResolvedValue(makeReport());
      reportRepo.findOne.mockResolvedValue(makeReport());

      await service.create(
        { beneficiaryId: 'ben-1', type: ReportType.PROGRESS, title: 'R', content: null } as any,
        tenantId,
        'spec-1',
      );
      expect(reportRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: {} }),
      );
    });

    it('should set status to DRAFT', async () => {
      reportRepo.create.mockReturnValue(makeReport());
      reportRepo.save.mockResolvedValue(makeReport());
      reportRepo.findOne.mockResolvedValue(makeReport());

      await service.create(
        { beneficiaryId: 'ben-1', type: ReportType.PROGRESS, title: 'R' } as any,
        tenantId,
        'spec-1',
      );
      expect(reportRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: ReportStatus.DRAFT }),
      );
    });
  });

  describe('findAll', () => {
    const setupQb = () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[makeReport()], 1]),
      };
      reportRepo.createQueryBuilder.mockReturnValue(qb);
      return qb;
    };

    it('should return paginated reports', async () => {
      const qb = setupQb();
      const result = await service.findAll({}, tenantId, makeUser());
      expect(result.data).toHaveLength(1);
    });

    it('should filter by specialist for specialist users', async () => {
      const qb = setupQb();
      await service.findAll({}, tenantId, makeUser(UserRole.SPECIALIST));
      expect(qb.andWhere).toHaveBeenCalledWith('r.specialist_id = :sid', { sid: 'spec-1' });
    });

    it('should filter beneficiary reports with shared + approved', async () => {
      const qb = setupQb();
      const benUser = { ...makeUser(UserRole.BENEFICIARY), beneficiaryId: 'ben-1' } as User;
      await service.findAll({}, tenantId, benUser);
      expect(qb.andWhere).toHaveBeenCalledWith('r.beneficiary_id = :bid', { bid: 'ben-1' });
      expect(qb.andWhere).toHaveBeenCalledWith('r.shared_with_beneficiary = true');
      expect(qb.andWhere).toHaveBeenCalledWith('r.status = :status', {
        status: ReportStatus.APPROVED,
      });
    });

    it('should apply type and status filters', async () => {
      const qb = setupQb();
      await service.findAll(
        { type: ReportType.PROGRESS, status: ReportStatus.SUBMITTED } as any,
        tenantId,
        makeUser(),
      );
      expect(qb.andWhere).toHaveBeenCalledWith('r.type = :type', { type: ReportType.PROGRESS });
      expect(qb.andWhere).toHaveBeenCalledWith('r.status = :status', {
        status: ReportStatus.SUBMITTED,
      });
    });
  });

  describe('findOne', () => {
    it('should return a report', async () => {
      reportRepo.findOne.mockResolvedValue(makeReport());
      const result = await service.findOne('rpt-1', tenantId);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if not found', async () => {
      reportRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent', tenantId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for beneficiary accessing unshared report', async () => {
      const report = makeReport({ sharedWithBeneficiary: false });
      reportRepo.findOne.mockResolvedValue(report);
      const benUser = { ...makeUser(UserRole.BENEFICIARY), beneficiaryId: 'ben-1' } as User;

      await expect(service.findOne('rpt-1', tenantId, benUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException for beneficiary accessing non-approved report', async () => {
      const report = makeReport({ sharedWithBeneficiary: true, status: ReportStatus.DRAFT });
      reportRepo.findOne.mockResolvedValue(report);
      const benUser = { ...makeUser(UserRole.BENEFICIARY), beneficiaryId: 'ben-1' } as User;

      await expect(service.findOne('rpt-1', tenantId, benUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow beneficiary to access shared approved report', async () => {
      const report = makeReport({ sharedWithBeneficiary: true, status: ReportStatus.APPROVED });
      reportRepo.findOne.mockResolvedValue(report);
      const benUser = { ...makeUser(UserRole.BENEFICIARY), beneficiaryId: 'ben-1' } as User;

      const result = await service.findOne('rpt-1', tenantId, benUser);
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update a report', async () => {
      reportRepo.findOne
        .mockResolvedValueOnce(makeReport())
        .mockResolvedValueOnce(makeReport());
      reportRepo.save.mockResolvedValue(makeReport());

      const result = await service.update(
        'rpt-1',
        { title: 'Updated' } as any,
        tenantId,
        makeUser(),
      );
      expect(reportRepo.save).toHaveBeenCalled();
    });

    it('should restrict specialist to own reports', async () => {
      const report = makeReport({ specialistId: 'other-spec' });
      reportRepo.findOne.mockResolvedValue(report);
      const specUser = makeUser(UserRole.SPECIALIST);

      await expect(
        service.update('rpt-1', { title: 'Test' } as any, tenantId, specUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should restrict specialist from editing approved reports', async () => {
      const report = makeReport({ status: ReportStatus.APPROVED });
      reportRepo.findOne.mockResolvedValue(report);
      const specUser = makeUser(UserRole.SPECIALIST);

      await expect(
        service.update('rpt-1', { title: 'Test' } as any, tenantId, specUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submit', () => {
    it('should submit a draft report', async () => {
      const report = makeReport({ status: ReportStatus.DRAFT });
      reportRepo.findOne.mockResolvedValue(report);
      reportRepo.save.mockResolvedValue(report);
      const specUser = makeUser(UserRole.SPECIALIST);

      const result = await service.submit('rpt-1', tenantId, specUser);
      expect(report.status).toBe(ReportStatus.SUBMITTED);
    });

    it('should throw ForbiddenException if not owner', async () => {
      const report = makeReport({ specialistId: 'other', status: ReportStatus.DRAFT });
      reportRepo.findOne.mockResolvedValue(report);
      const specUser = makeUser(UserRole.SPECIALIST);

      await expect(service.submit('rpt-1', tenantId, specUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if not draft', async () => {
      const report = makeReport({ status: ReportStatus.SUBMITTED });
      reportRepo.findOne.mockResolvedValue(report);
      const specUser = makeUser(UserRole.SPECIALIST);

      await expect(service.submit('rpt-1', tenantId, specUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('approve', () => {
    it('should approve a submitted report', async () => {
      const report = makeReport({ status: ReportStatus.SUBMITTED });
      reportRepo.findOne.mockResolvedValue(report);
      reportRepo.save.mockResolvedValue(report);

      const result = await service.approve('rpt-1', {} as any, tenantId, 'admin-1');
      expect(report.status).toBe(ReportStatus.APPROVED);
      expect(report.approvedById).toBe('admin-1');
    });

    it('should throw BadRequestException if not submitted', async () => {
      const report = makeReport({ status: ReportStatus.DRAFT });
      reportRepo.findOne.mockResolvedValue(report);

      await expect(
        service.approve('rpt-1', {} as any, tenantId, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('toggleShare', () => {
    it('should toggle sharedWithBeneficiary', async () => {
      const report = makeReport({ sharedWithBeneficiary: false, status: ReportStatus.APPROVED });
      reportRepo.findOne.mockResolvedValue(report);
      reportRepo.save.mockResolvedValue(report);

      const result = await service.toggleShare('rpt-1', tenantId);
      expect(report.sharedWithBeneficiary).toBe(true);
    });

    it('should throw BadRequestException if not approved', async () => {
      const report = makeReport({ status: ReportStatus.DRAFT });
      reportRepo.findOne.mockResolvedValue(report);

      await expect(service.toggleShare('rpt-1', tenantId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should forbid specialist sharing another specialist report', async () => {
      const report = makeReport({ specialistId: 'other-spec', status: ReportStatus.APPROVED });
      reportRepo.findOne.mockResolvedValue(report);
      const specUser = makeUser(UserRole.SPECIALIST);

      await expect(service.toggleShare('rpt-1', tenantId, specUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should forbid receptionist from sharing reports', async () => {
      const report = makeReport({ status: ReportStatus.APPROVED });
      reportRepo.findOne.mockResolvedValue(report);
      const receptionist = makeUser(UserRole.RECEPTIONIST);

      await expect(service.toggleShare('rpt-1', tenantId, receptionist)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow specialist owner to share own report', async () => {
      const report = makeReport({ specialistId: 'spec-1', status: ReportStatus.APPROVED });
      reportRepo.findOne.mockResolvedValue(report);
      reportRepo.save.mockResolvedValue(report);
      const specUser = makeUser(UserRole.SPECIALIST);

      const result = await service.toggleShare('rpt-1', tenantId, specUser);
      expect(report.sharedWithBeneficiary).toBe(true);
    });
  });

  describe('archive', () => {
    it('should archive a report', async () => {
      const report = makeReport();
      reportRepo.findOne.mockResolvedValue(report);
      reportRepo.save.mockResolvedValue(report);

      await service.archive('rpt-1', tenantId);
      expect(report.status).toBe(ReportStatus.ARCHIVED);
    });
  });

  describe('getStats', () => {
    it('should return report stats', async () => {
      reportRepo.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(5);

      const mockQb: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ type: 'progress', count: '20' }]),
      };
      reportRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getStats(tenantId);
      expect(result.total).toBe(50);
      expect(result.drafts).toBe(10);
      expect(result.submitted).toBe(5);
      expect(result.approved).toBe(30);
      expect(result.archived).toBe(5);
      expect(result.byType).toHaveLength(1);
    });
  });
});
