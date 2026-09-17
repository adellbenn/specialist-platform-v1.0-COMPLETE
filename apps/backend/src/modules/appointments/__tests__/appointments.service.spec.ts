import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { AppointmentsService } from '../appointments.service';
import { Appointment, AppointmentStatus, AppointmentType } from '../appointment.entity';
import { Session } from '@modules/sessions/session.entity';
import { User, UserRole } from '@modules/users/user.entity';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let appointmentRepo: jest.Mocked<Repository<Appointment>>;
  let sessionRepo: jest.Mocked<Repository<Session>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let beneficiaryRepo: jest.Mocked<Repository<Beneficiary>>;

  const tenantId = 'tenant-1';
  const specialistId = 'spec-1';
  const beneficiaryId = 'ben-1';

  const makeAppointment = (overrides: Partial<Appointment> = {}): Appointment =>
    ({
      id: 'apt-1',
      tenantId,
      beneficiaryId,
      specialistId,
      scheduledAt: new Date('2025-06-15T10:00:00Z'),
      durationMinutes: 60,
      type: AppointmentType.FOLLOW_UP,
      status: AppointmentStatus.SCHEDULED,
      location: 'Room 1',
      notes: null,
      cancellationReason: null,
      createdById: 'user-1',
      beneficiary: { id: beneficiaryId, firstName: 'Ahmed', lastName: 'Ali', fileNumber: 'BNF-00001' } as any,
      specialist: { id: specialistId, firstName: 'Dr. Sara', lastName: 'Ahmed' } as any,
      createdBy: { id: 'user-1', firstName: 'Admin', lastName: 'User' } as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Appointment;

  const makeUser = (role: UserRole = UserRole.CENTER_MANAGER): User =>
    ({
      id: specialistId,
      tenantId,
      role,
      firstName: 'Dr.',
      lastName: 'Specialist',
      email: 'spec@test.com',
      isActive: true,
      beneficiaryId: null,
    }) as unknown as User;

  const makeBeneficiary = (overrides: Partial<Beneficiary> = {}): Beneficiary =>
    ({ id: beneficiaryId, tenantId, ...overrides }) as Beneficiary;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getRepositoryToken(Appointment),
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
          provide: getRepositoryToken(Session),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
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

    service = module.get(AppointmentsService);
    appointmentRepo = module.get(getRepositoryToken(Appointment));
    sessionRepo = module.get(getRepositoryToken(Session));
    userRepo = module.get(getRepositoryToken(User));
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
      getMany: jest.fn().mockResolvedValue([]),
    };
    appointmentRepo.createQueryBuilder.mockReturnValue(qb);
    return qb;
  };

  const setupConflictQb = (conflicts: Appointment[] = []) => {
    const qb: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(conflicts),
    };
    appointmentRepo.createQueryBuilder.mockReturnValue(qb);
    return qb;
  };

  describe('create', () => {
    it('should create an appointment successfully', async () => {
      setupConflictQb([]);
      userRepo.findOne.mockResolvedValue(makeUser());
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      appointmentRepo.create.mockReturnValue(makeAppointment());
      appointmentRepo.save.mockResolvedValue(makeAppointment());
      appointmentRepo.findOne.mockResolvedValue(makeAppointment());

      const result = await service.create(
        {
          beneficiaryId,
          specialistId,
          scheduledAt: '2025-06-15T10:00:00Z',
          type: AppointmentType.FOLLOW_UP,
          durationMinutes: 60,
        } as any,
        tenantId,
        'user-1',
      );
      expect(result).toBeDefined();
      expect(beneficiaryRepo.findOne).toHaveBeenCalledWith({
        where: { id: beneficiaryId, tenantId },
      });
      expect(appointmentRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if beneficiary not found in tenant', async () => {
      setupConflictQb([]);
      userRepo.findOne.mockResolvedValue(makeUser());
      beneficiaryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          {
            beneficiaryId: 'nonexistent',
            specialistId,
            scheduledAt: '2025-06-15T10:00:00Z',
          } as any,
          tenantId,
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(appointmentRepo.save).not.toHaveBeenCalled();
    });

    it('should reject a beneficiary from another tenant', async () => {
      setupConflictQb([]);
      userRepo.findOne.mockResolvedValue(makeUser());
      beneficiaryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          {
            beneficiaryId: 'ben-other-tenant',
            specialistId,
            scheduledAt: '2025-06-15T10:00:00Z',
          } as any,
          tenantId,
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(beneficiaryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'ben-other-tenant', tenantId },
      });
      expect(appointmentRepo.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if beneficiaryId is missing without querying the repository', async () => {
      setupConflictQb([]);
      userRepo.findOne.mockResolvedValue(makeUser());

      await expect(
        service.create(
          {
            specialistId,
            scheduledAt: '2025-06-15T10:00:00Z',
          } as any,
          tenantId,
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(beneficiaryRepo.findOne).not.toHaveBeenCalled();
      expect(appointmentRepo.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if specialist not found in tenant', async () => {
      setupConflictQb([]);
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          {
            beneficiaryId,
            specialistId: 'nonexistent',
            scheduledAt: '2025-06-15T10:00:00Z',
          } as any,
          tenantId,
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException on scheduling conflict', async () => {
      const conflicting = makeAppointment({
        scheduledAt: new Date('2025-06-15T10:30:00Z'),
        durationMinutes: 60,
        status: AppointmentStatus.SCHEDULED,
      });
      setupConflictQb([conflicting]);
      userRepo.findOne.mockResolvedValue(makeUser());

      await expect(
        service.create(
          {
            beneficiaryId,
            specialistId,
            scheduledAt: '2025-06-15T10:00:00Z',
            durationMinutes: 60,
          } as any,
          tenantId,
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should default durationMinutes to 60 for conflict check', async () => {
      setupConflictQb([]);
      userRepo.findOne.mockResolvedValue(makeUser());
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      appointmentRepo.create.mockReturnValue(makeAppointment());
      appointmentRepo.save.mockResolvedValue(makeAppointment());
      appointmentRepo.findOne.mockResolvedValue(makeAppointment());

      await service.create(
        {
          beneficiaryId,
          specialistId,
          scheduledAt: '2025-06-15T10:00:00Z',
        } as any,
        tenantId,
        'user-1',
      );
      expect(appointmentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          beneficiaryId,
          specialistId,
          tenantId,
          createdById: 'user-1',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const qb = setupQb();
      qb.getManyAndCount.mockResolvedValue([[makeAppointment()], 1]);
      const user = makeUser();

      const result = await service.findAll({}, tenantId, user);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by specialistId for specialist users', async () => {
      const qb = setupQb();
      const specialistUser = makeUser(UserRole.SPECIALIST);
      specialistUser.id = specialistId;

      await service.findAll({}, tenantId, specialistUser);
      expect(qb.andWhere).toHaveBeenCalledWith('a.specialist_id = :sid', { sid: specialistId });
    });

    it('should filter by beneficiaryId for beneficiary users', async () => {
      const qb = setupQb();
      const benUser = { ...makeUser(UserRole.BENEFICIARY), beneficiaryId } as User;

      await service.findAll({}, tenantId, benUser);
      expect(qb.andWhere).toHaveBeenCalledWith('a.beneficiary_id = :bid', { bid: beneficiaryId });
    });

    it('should apply status filter', async () => {
      const qb = setupQb();
      const user = makeUser();

      await service.findAll({ status: AppointmentStatus.SCHEDULED } as any, tenantId, user);
      expect(qb.andWhere).toHaveBeenCalledWith('a.status = :status', {
        status: AppointmentStatus.SCHEDULED,
      });
    });

    it('should apply type filter', async () => {
      const qb = setupQb();
      const user = makeUser();

      await service.findAll({ type: AppointmentType.INITIAL } as any, tenantId, user);
      expect(qb.andWhere).toHaveBeenCalledWith('a.type = :type', {
        type: AppointmentType.INITIAL,
      });
    });

    it('should apply dateFrom filter', async () => {
      const qb = setupQb();
      const user = makeUser();

      await service.findAll({ dateFrom: '2025-01-01' } as any, tenantId, user);
      expect(qb.andWhere).toHaveBeenCalledWith('a.scheduled_at >= :from', {
        from: expect.any(Date),
      });
    });

    it('should apply dateTo filter', async () => {
      const qb = setupQb();
      const user = makeUser();

      await service.findAll({ dateTo: '2025-12-31' } as any, tenantId, user);
      expect(qb.andWhere).toHaveBeenCalledWith('a.scheduled_at <= :to', {
        to: expect.any(Date),
      });
    });

    it('should apply specialistId filter for non-specialist users', async () => {
      const qb = setupQb();
      const user = makeUser();

      await service.findAll({ specialistId: 'spec-2' } as any, tenantId, user);
      expect(qb.andWhere).toHaveBeenCalledWith('a.specialist_id = :sid', { sid: 'spec-2' });
    });

    it('should apply beneficiaryId filter for non-beneficiary users', async () => {
      const qb = setupQb();
      const user = makeUser();

      await service.findAll({ beneficiaryId: 'ben-2' } as any, tenantId, user);
      expect(qb.andWhere).toHaveBeenCalledWith('a.beneficiary_id = :bid', { bid: 'ben-2' });
    });
  });

  describe('getCalendarData', () => {
    it('should return calendar data grouped by day', async () => {
      const apt = makeAppointment({ scheduledAt: new Date('2025-06-15T10:00:00Z') });
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([apt]),
      };
      appointmentRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getCalendarData(2025, 6, tenantId, makeUser());
      expect(result.appointments).toHaveLength(1);
      expect(result.byDay).toBeDefined();
    });

    it('should apply filters to calendar data', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      appointmentRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getCalendarData(2025, 6, tenantId, makeUser(), {
        status: AppointmentStatus.SCHEDULED,
        location: 'Room',
      });
      expect(qb.andWhere).toHaveBeenCalled();
    });

    it('should filter for specialist users in calendar', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      appointmentRepo.createQueryBuilder.mockReturnValue(qb);
      const specUser = makeUser(UserRole.SPECIALIST);

      await service.getCalendarData(2025, 6, tenantId, specUser);
      expect(qb.andWhere).toHaveBeenCalledWith('a.specialist_id = :sid', { sid: specialistId });
    });

    it('should filter for beneficiary users in calendar', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      appointmentRepo.createQueryBuilder.mockReturnValue(qb);
      const benUser = { ...makeUser(UserRole.BENEFICIARY), beneficiaryId } as User;

      await service.getCalendarData(2025, 6, tenantId, benUser);
      expect(qb.andWhere).toHaveBeenCalledWith('a.beneficiary_id = :bid', { bid: beneficiaryId });
    });
  });

  describe('findOne', () => {
    it('should return an appointment', async () => {
      appointmentRepo.findOne.mockResolvedValue(makeAppointment());
      const result = await service.findOne('apt-1', tenantId);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if not found', async () => {
      appointmentRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent', tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for beneficiary accessing other beneficiary appointment', async () => {
      const apt = makeAppointment({ beneficiaryId: 'ben-2' });
      appointmentRepo.findOne.mockResolvedValue(apt);
      const benUser = { ...makeUser(UserRole.BENEFICIARY), beneficiaryId: 'ben-1' } as User;

      await expect(service.findOne('apt-1', tenantId, benUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for specialist accessing other specialist appointment', async () => {
      const apt = makeAppointment({ specialistId: 'spec-2' });
      appointmentRepo.findOne.mockResolvedValue(apt);
      const specUser = makeUser(UserRole.SPECIALIST);
      specUser.id = 'spec-1';

      await expect(service.findOne('apt-1', tenantId, specUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return appointment if specialist owns it', async () => {
      const apt = makeAppointment();
      appointmentRepo.findOne.mockResolvedValue(apt);
      const specUser = makeUser(UserRole.SPECIALIST);
      specUser.id = specialistId;

      const result = await service.findOne('apt-1', tenantId, specUser);
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update an appointment', async () => {
      const apt = makeAppointment();
      appointmentRepo.findOne.mockResolvedValue(apt);
      setupConflictQb([]);
      appointmentRepo.save.mockResolvedValue(apt);

      const result = await service.update(
        'apt-1',
        { notes: 'updated' } as any,
        tenantId,
      );
      expect(appointmentRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when updating completed appointment', async () => {
      const apt = makeAppointment({ status: AppointmentStatus.COMPLETED });
      appointmentRepo.findOne.mockResolvedValue(apt);

      await expect(
        service.update('apt-1', { notes: 'test' } as any, tenantId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when updating cancelled appointment', async () => {
      const apt = makeAppointment({ status: AppointmentStatus.CANCELLED });
      appointmentRepo.findOne.mockResolvedValue(apt);

      await expect(
        service.update('apt-1', { notes: 'test' } as any, tenantId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update an appointment when changing beneficiaryId to a valid same-tenant beneficiary', async () => {
      const apt = makeAppointment();
      appointmentRepo.findOne.mockResolvedValue(apt);
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary({ id: 'new-ben' }));
      appointmentRepo.save.mockResolvedValue(apt);

      const result = await service.update('apt-1', { beneficiaryId: 'new-ben' } as any, tenantId);

      expect(beneficiaryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'new-ben', tenantId },
      });
      expect(apt.beneficiaryId).toBe('new-ben');
      expect(appointmentRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException when changing beneficiaryId to one not in the tenant', async () => {
      const apt = makeAppointment();
      appointmentRepo.findOne.mockResolvedValue(apt);
      beneficiaryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('apt-1', { beneficiaryId: 'nonexistent' } as any, tenantId),
      ).rejects.toThrow(BadRequestException);
      expect(beneficiaryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'nonexistent', tenantId },
      });
      expect(appointmentRepo.save).not.toHaveBeenCalled();
    });

    it('should reject updating beneficiaryId to a beneficiary from another tenant', async () => {
      const apt = makeAppointment();
      appointmentRepo.findOne.mockResolvedValue(apt);
      beneficiaryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('apt-1', { beneficiaryId: 'ben-other-tenant' } as any, tenantId),
      ).rejects.toThrow(BadRequestException);
      expect(beneficiaryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'ben-other-tenant', tenantId },
      });
      expect(appointmentRepo.save).not.toHaveBeenCalled();
    });

    it('should validate a changed specialist belongs to the same tenant', async () => {
      const apt = makeAppointment();
      const newSpecialist = makeUser(UserRole.SPECIALIST);
      newSpecialist.id = 'spec-2';
      appointmentRepo.findOne.mockResolvedValue(apt);
      userRepo.findOne.mockResolvedValue(newSpecialist);
      appointmentRepo.save.mockResolvedValue(apt);

      await service.update('apt-1', { specialistId: 'spec-2' } as any, tenantId);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'spec-2', tenantId, role: UserRole.SPECIALIST },
      });
      expect(apt.specialistId).toBe('spec-2');
      expect(appointmentRepo.save).toHaveBeenCalled();
    });

    it('should reject updating specialistId to a specialist not in the tenant', async () => {
      const apt = makeAppointment();
      appointmentRepo.findOne.mockResolvedValue(apt);
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('apt-1', { specialistId: 'spec-other-tenant' } as any, tenantId),
      ).rejects.toThrow(BadRequestException);
      expect(appointmentRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('confirm', () => {
    it('should confirm a scheduled appointment', async () => {
      const apt = makeAppointment({ status: AppointmentStatus.SCHEDULED });
      appointmentRepo.findOne.mockResolvedValue(apt);
      appointmentRepo.save.mockResolvedValue(apt);

      const result = await service.confirm('apt-1', tenantId);
      expect(apt.status).toBe(AppointmentStatus.CONFIRMED);
    });

    it('should throw BadRequestException if not scheduled', async () => {
      const apt = makeAppointment({ status: AppointmentStatus.CONFIRMED });
      appointmentRepo.findOne.mockResolvedValue(apt);

      await expect(service.confirm('apt-1', tenantId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel an appointment', async () => {
      const apt = makeAppointment({ status: AppointmentStatus.SCHEDULED });
      appointmentRepo.findOne.mockResolvedValue(apt);
      appointmentRepo.save.mockResolvedValue(apt);

      const result = await service.cancel('apt-1', 'Reason', tenantId);
      expect(apt.status).toBe(AppointmentStatus.CANCELLED);
      expect(apt.cancellationReason).toBe('Reason');
    });

    it('should throw BadRequestException when cancelling completed appointment', async () => {
      const apt = makeAppointment({ status: AppointmentStatus.COMPLETED });
      appointmentRepo.findOne.mockResolvedValue(apt);

      await expect(service.cancel('apt-1', 'reason', tenantId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when cancelling already cancelled appointment', async () => {
      const apt = makeAppointment({ status: AppointmentStatus.CANCELLED });
      appointmentRepo.findOne.mockResolvedValue(apt);

      await expect(service.cancel('apt-1', 'reason', tenantId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('markNoShow', () => {
    it('should mark appointment as no show', async () => {
      const apt = makeAppointment();
      appointmentRepo.findOne.mockResolvedValue(apt);
      appointmentRepo.save.mockResolvedValue(apt);

      const result = await service.markNoShow('apt-1', tenantId);
      expect(apt.status).toBe(AppointmentStatus.NO_SHOW);
    });
  });

  describe('complete', () => {
    it('should complete an appointment and create a session', async () => {
      const apt = makeAppointment({ status: AppointmentStatus.SCHEDULED });
      appointmentRepo.findOne.mockResolvedValue(apt);
      sessionRepo.count.mockResolvedValue(2);
      appointmentRepo.save.mockResolvedValue(apt);
      sessionRepo.create.mockReturnValue({} as any);
      sessionRepo.save.mockResolvedValue({ id: 'sess-1' } as any);

      const result = await service.complete(
        'apt-1',
        {
          beneficiaryId,
          specialistId,
          startedAt: '2025-06-15T10:00:00Z',
        } as any,
        tenantId,
        specialistId,
      );
      expect(apt.status).toBe(AppointmentStatus.COMPLETED);
      expect(sessionRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if appointment is in wrong status', async () => {
      const apt = makeAppointment({ status: AppointmentStatus.CANCELLED });
      appointmentRepo.findOne.mockResolvedValue(apt);

      await expect(
        service.complete('apt-1', {} as any, tenantId, specialistId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate sessionNumber correctly', async () => {
      const apt = makeAppointment({ status: AppointmentStatus.CONFIRMED });
      appointmentRepo.findOne.mockResolvedValue(apt);
      sessionRepo.count.mockResolvedValue(5);
      appointmentRepo.save.mockResolvedValue(apt);
      sessionRepo.create.mockReturnValue({} as any);
      sessionRepo.save.mockResolvedValue({} as any);

      await service.complete('apt-1', {} as any, tenantId, specialistId);
      expect(sessionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ sessionNumber: 6 }),
      );
    });
  });

  describe('getTodayAppointments', () => {
    it('should return today appointments', async () => {
      appointmentRepo.find.mockResolvedValue([makeAppointment()]);
      const result = await service.getTodayAppointments(tenantId);
      expect(result).toHaveLength(1);
    });

    it('should filter by specialistId', async () => {
      appointmentRepo.find.mockResolvedValue([]);
      await service.getTodayAppointments(tenantId, specialistId);
      expect(appointmentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ specialistId }),
        }),
      );
    });
  });

  describe('getStats', () => {
    it('should return appointment stats', async () => {
      appointmentRepo.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(10) // thisMonth
        .mockResolvedValueOnce(80) // completed
        .mockResolvedValueOnce(10) // cancelled
        .mockResolvedValueOnce(5) // noShow
        .mockResolvedValueOnce(15); // upcoming

      const result = await service.getStats(tenantId);
      expect(result).toEqual({
        total: 100,
        thisMonth: 10,
        completed: 80,
        cancelled: 10,
        noShow: 5,
        upcoming: 15,
        completionRate: 80,
      });
    });

    it('should return 0 completion rate when no appointments', async () => {
      appointmentRepo.count.mockResolvedValue(0);

      const result = await service.getStats(tenantId);
      expect(result.completionRate).toBe(0);
    });
  });
});
