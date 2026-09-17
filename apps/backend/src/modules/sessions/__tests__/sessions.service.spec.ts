import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SessionsService } from '../sessions.service';
import { Session, AttendanceStatus } from '../session.entity';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';
import { User, UserRole } from '@modules/users/user.entity';

describe('SessionsService', () => {
  let service: SessionsService;
  let sessionRepo: jest.Mocked<Repository<Session>>;
  let beneficiaryRepo: jest.Mocked<Repository<Beneficiary>>;

  const tenantId = 'tenant-1';

  const makeBeneficiary = (overrides: Partial<Beneficiary> = {}): Beneficiary =>
    ({
      id: 'ben-1',
      tenantId,
      firstName: 'Ahmed',
      lastName: 'Ali',
      fileNumber: 'BNF-00001',
      ...overrides,
    }) as Beneficiary;

  const makeSession = (overrides: Partial<Session> = {}): Session =>
    ({
      id: 'sess-1',
      tenantId,
      beneficiaryId: 'ben-1',
      specialistId: 'spec-1',
      appointmentId: 'apt-1',
      sessionNumber: 1,
      startedAt: new Date('2025-06-15T10:00:00Z'),
      endedAt: null,
      actualDurationMinutes: null,
      attendance: AttendanceStatus.PRESENT,
      sessionNotes: null,
      beneficiary: { id: 'ben-1', firstName: 'Ahmed', lastName: 'Ali', fileNumber: 'BNF-00001' } as any,
      specialist: { id: 'spec-1', firstName: 'Dr.', lastName: 'Sara' } as any,
      appointment: { id: 'apt-1' } as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Session;

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
        SessionsService,
        {
          provide: getRepositoryToken(Session),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Beneficiary),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SessionsService);
    sessionRepo = module.get(getRepositoryToken(Session));
    beneficiaryRepo = module.get(getRepositoryToken(Beneficiary));
  });

  afterEach(() => jest.clearAllMocks());

  const setupQb = () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    sessionRepo.createQueryBuilder.mockReturnValue(qb);
    return qb;
  };

  describe('create', () => {
    it('should create a session', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      sessionRepo.count.mockResolvedValue(0);
      sessionRepo.create.mockReturnValue(makeSession());
      sessionRepo.save.mockResolvedValue(makeSession());
      sessionRepo.findOne.mockResolvedValue(makeSession());

      const result = await service.create(
        {
          beneficiaryId: 'ben-1',
          specialistId: 'spec-1',
          startedAt: '2025-06-15T10:00:00Z',
        } as any,
        tenantId,
      );
      expect(result).toBeDefined();
      expect(sessionRepo.save).toHaveBeenCalled();
    });

    it('should scope the beneficiary lookup to the tenant', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      sessionRepo.count.mockResolvedValue(0);
      sessionRepo.create.mockReturnValue(makeSession());
      sessionRepo.save.mockResolvedValue(makeSession());
      sessionRepo.findOne.mockResolvedValue(makeSession());

      await service.create(
        { beneficiaryId: 'ben-1', specialistId: 'spec-1', startedAt: '2025-06-15T10:00:00Z' } as any,
        tenantId,
      );
      expect(beneficiaryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'ben-1', tenantId },
      });
    });

    it('should throw BadRequestException when beneficiary does not exist', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          {
            beneficiaryId: 'ben-missing',
            specialistId: 'spec-1',
            startedAt: '2025-06-15T10:00:00Z',
          } as any,
          tenantId,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(sessionRepo.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when beneficiary does not belong to the tenant', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          {
            beneficiaryId: 'ben-other-tenant',
            specialistId: 'spec-1',
            startedAt: '2025-06-15T10:00:00Z',
          } as any,
          tenantId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when beneficiaryId is missing', async () => {
      await expect(
        service.create(
          { specialistId: 'spec-1', startedAt: '2025-06-15T10:00:00Z' } as any,
          tenantId,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(beneficiaryRepo.findOne).not.toHaveBeenCalled();
    });

    it('should set sessionNumber based on count', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      sessionRepo.count.mockResolvedValue(5);
      sessionRepo.create.mockReturnValue(makeSession({ sessionNumber: 6 }));
      sessionRepo.save.mockResolvedValue(makeSession({ sessionNumber: 6 }));
      sessionRepo.findOne.mockResolvedValue(makeSession({ sessionNumber: 6 }));

      await service.create(
        {
          beneficiaryId: 'ben-1',
          specialistId: 'spec-1',
          startedAt: '2025-06-15T10:00:00Z',
        } as any,
        tenantId,
      );
      expect(sessionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ sessionNumber: 6 }),
      );
    });

    it('should handle optional endedAt', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      sessionRepo.count.mockResolvedValue(0);
      sessionRepo.create.mockReturnValue(makeSession());
      sessionRepo.save.mockResolvedValue(makeSession());
      sessionRepo.findOne.mockResolvedValue(makeSession());

      await service.create(
        {
          beneficiaryId: 'ben-1',
          specialistId: 'spec-1',
          startedAt: '2025-06-15T10:00:00Z',
          endedAt: '2025-06-15T11:00:00Z',
        } as any,
        tenantId,
      );
      expect(sessionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ endedAt: expect.any(Date) }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated sessions', async () => {
      const qb = setupQb();
      qb.getManyAndCount.mockResolvedValue([[makeSession()], 1]);
      const user = makeUser();

      const result = await service.findAll({}, tenantId, user);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by specialist for specialist users', async () => {
      const qb = setupQb();
      const specUser = makeUser(UserRole.SPECIALIST);

      await service.findAll({}, tenantId, specUser);
      expect(qb.andWhere).toHaveBeenCalledWith('s.specialist_id = :sid', { sid: 'spec-1' });
    });

    it('should filter by beneficiary for beneficiary users', async () => {
      const qb = setupQb();
      const benUser = { ...makeUser(UserRole.BENEFICIARY), beneficiaryId: 'ben-1' } as User;

      await service.findAll({}, tenantId, benUser);
      expect(qb.andWhere).toHaveBeenCalledWith('s.beneficiary_id = :bid', { bid: 'ben-1' });
    });

    it('should apply attendance filter', async () => {
      const qb = setupQb();
      const user = makeUser();

      await service.findAll({ attendance: AttendanceStatus.LATE } as any, tenantId, user);
      expect(qb.andWhere).toHaveBeenCalledWith('s.attendance = :attendance', {
        attendance: AttendanceStatus.LATE,
      });
    });

    it('should apply date filters', async () => {
      const qb = setupQb();
      const user = makeUser();

      await service.findAll(
        { dateFrom: '2025-01-01', dateTo: '2025-12-31' } as any,
        tenantId,
        user,
      );
      expect(qb.andWhere).toHaveBeenCalledWith('s.started_at >= :from', { from: expect.any(Date) });
      expect(qb.andWhere).toHaveBeenCalledWith('s.started_at <= :to', { to: expect.any(Date) });
    });
  });

  describe('findOne', () => {
    it('should return a session', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession());
      const result = await service.findOne('sess-1', tenantId);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if not found', async () => {
      sessionRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent', tenantId)).rejects.toThrow(NotFoundException);
    });

    it('should restrict specialist access', async () => {
      const sess = makeSession({ specialistId: 'spec-other' });
      sessionRepo.findOne.mockResolvedValue(sess);
      const specUser = makeUser(UserRole.SPECIALIST);

      await expect(service.findOne('sess-1', tenantId, specUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should restrict beneficiary access', async () => {
      const sess = makeSession({ beneficiaryId: 'ben-other' });
      sessionRepo.findOne.mockResolvedValue(sess);
      const benUser = { ...makeUser(UserRole.BENEFICIARY), beneficiaryId: 'ben-1' } as User;

      await expect(service.findOne('sess-1', tenantId, benUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a session', async () => {
      sessionRepo.findOne
        .mockResolvedValueOnce(makeSession())
        .mockResolvedValueOnce(makeSession());
      sessionRepo.save.mockResolvedValue(makeSession());

      const result = await service.update(
        'sess-1',
        { sessionNotes: 'Updated notes' } as any,
        tenantId,
      );
      expect(sessionRepo.save).toHaveBeenCalled();
    });

    it('should handle startedAt and endedAt conversion', async () => {
      sessionRepo.findOne
        .mockResolvedValueOnce(makeSession())
        .mockResolvedValueOnce(makeSession());
      sessionRepo.save.mockResolvedValue(makeSession());

      await service.update(
        'sess-1',
        {
          startedAt: '2025-06-15T10:00:00Z',
          endedAt: '2025-06-15T11:00:00Z',
        } as any,
        tenantId,
      );
      expect(sessionRepo.save).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return session stats', async () => {
      sessionRepo.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(10) // thisMonth
        .mockResolvedValueOnce(80) // present
        .mockResolvedValueOnce(15) // absent
        .mockResolvedValueOnce(5); // late

      const result = await service.getStats(tenantId);
      expect(result).toEqual({
        total: 100,
        thisMonth: 10,
        present: 80,
        absent: 15,
        late: 5,
        attendanceRate: 80,
      });
    });

    it('should return 0 attendance rate when no sessions', async () => {
      sessionRepo.count.mockResolvedValue(0);

      const result = await service.getStats(tenantId);
      expect(result.attendanceRate).toBe(0);
    });
  });
});
