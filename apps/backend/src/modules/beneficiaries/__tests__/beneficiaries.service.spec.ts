import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BeneficiariesService } from '../beneficiaries.service';
import { Beneficiary, BeneficiaryStatus, CaseType } from '../beneficiary.entity';
import { BeneficiaryFile } from '../beneficiary-file.entity';
import { User, UserRole } from '@modules/users/user.entity';

describe('BeneficiariesService', () => {
  let service: BeneficiariesService;
  let beneficiaryRepo: jest.Mocked<Repository<Beneficiary>>;
  let fileRepo: jest.Mocked<Repository<BeneficiaryFile>>;
  let userRepo: jest.Mocked<Repository<User>>;

  const tenantId = 'tenant-1';
  const specialistId = 'spec-1';

  const makeBeneficiary = (overrides: Partial<Beneficiary> = {}): Beneficiary =>
    ({
      id: 'ben-1',
      tenantId,
      fileNumber: 'BNF-00001',
      firstName: 'Ahmed',
      lastName: 'Ali',
      caseType: CaseType.PSYCHOLOGICAL,
      status: BeneficiaryStatus.ACTIVE,
      assignedSpecialistId: specialistId,
      intakeDate: new Date('2025-01-01'),
      createdById: 'user-1',
      assignedSpecialist: { id: specialistId, firstName: 'Dr.', lastName: 'Sara' } as any,
      createdBy: { id: 'user-1', firstName: 'Admin', lastName: 'User' } as any,
      tenant: { id: tenantId, name: 'Center' } as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Beneficiary;

  const makeUser = (role: UserRole = UserRole.CENTER_MANAGER): User =>
    ({
      id: specialistId,
      tenantId,
      role,
      firstName: 'Dr.',
      lastName: 'Specialist',
      isActive: true,
      beneficiaryId: null,
    }) as unknown as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BeneficiariesService,
        {
          provide: getRepositoryToken(Beneficiary),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BeneficiaryFile),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
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
      ],
    }).compile();

    service = module.get(BeneficiariesService);
    beneficiaryRepo = module.get(getRepositoryToken(Beneficiary));
    fileRepo = module.get(getRepositoryToken(BeneficiaryFile));
    userRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create a beneficiary with file number', async () => {
      beneficiaryRepo.count.mockResolvedValue(0);
      beneficiaryRepo.create.mockReturnValue(makeBeneficiary());
      beneficiaryRepo.save.mockResolvedValue(makeBeneficiary());
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      fileRepo.create.mockReturnValue({} as any);
      fileRepo.save.mockResolvedValue({} as any);

      const result = await service.create(
        {
          firstName: 'Ahmed',
          lastName: 'Ali',
          caseType: CaseType.PSYCHOLOGICAL,
        } as any,
        tenantId,
        'user-1',
      );
      expect(result).toBeDefined();
      expect(beneficiaryRepo.save).toHaveBeenCalled();
      expect(fileRepo.save).toHaveBeenCalled();
    });

    it('should generate sequential file number', async () => {
      beneficiaryRepo.count.mockResolvedValue(5);
      beneficiaryRepo.create.mockReturnValue(makeBeneficiary({ fileNumber: 'BNF-00006' }));
      beneficiaryRepo.save.mockResolvedValue(makeBeneficiary({ fileNumber: 'BNF-00006' }));
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary({ fileNumber: 'BNF-00006' }));
      fileRepo.create.mockReturnValue({} as any);
      fileRepo.save.mockResolvedValue({} as any);

      await service.create(
        { firstName: 'Test', lastName: 'User', caseType: CaseType.EDUCATIONAL } as any,
        tenantId,
        'user-1',
      );
      expect(beneficiaryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ fileNumber: 'BNF-00006' }),
      );
    });

    it('should validate specialist belongs to tenant', async () => {
      beneficiaryRepo.count.mockResolvedValue(0);
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          { firstName: 'Test', lastName: 'User', caseType: CaseType.SPEECH, assignedSpecialistId: 'bad-spec' } as any,
          tenantId,
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should skip specialist validation if not assigned', async () => {
      beneficiaryRepo.count.mockResolvedValue(0);
      beneficiaryRepo.create.mockReturnValue(makeBeneficiary({ assignedSpecialistId: undefined }));
      beneficiaryRepo.save.mockResolvedValue(makeBeneficiary({ assignedSpecialistId: undefined }));
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary({ assignedSpecialistId: undefined }));
      fileRepo.create.mockReturnValue({} as any);
      fileRepo.save.mockResolvedValue({} as any);

      await service.create(
        { firstName: 'Test', lastName: 'User', caseType: CaseType.SPEECH } as any,
        tenantId,
        'user-1',
      );
      expect(userRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated beneficiaries', async () => {
      beneficiaryRepo.findAndCount.mockResolvedValue([[makeBeneficiary()], 1]);
      const user = makeUser();

      const result = await service.findAll({}, tenantId, user);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by specialist for specialist users', async () => {
      beneficiaryRepo.findAndCount.mockResolvedValue([[], 0]);
      const specUser = makeUser(UserRole.SPECIALIST);

      await service.findAll({}, tenantId, specUser);
      expect(beneficiaryRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assignedSpecialistId: specialistId }),
        }),
      );
    });

    it('should search by name/fileNumber/nationalId', async () => {
      beneficiaryRepo.findAndCount.mockResolvedValue([[], 0]);
      const user = makeUser();

      await service.findAll({ search: 'Ahmed' } as any, tenantId, user);
      expect(beneficiaryRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([expect.objectContaining({ firstName: expect.anything() })]),
        }),
      );
    });

    it('should filter by status and caseType', async () => {
      beneficiaryRepo.findAndCount.mockResolvedValue([[], 0]);
      const user = makeUser();

      await service.findAll(
        { status: BeneficiaryStatus.ACTIVE, caseType: CaseType.PSYCHOLOGICAL } as any,
        tenantId,
        user,
      );
      expect(beneficiaryRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: BeneficiaryStatus.ACTIVE,
            caseType: CaseType.PSYCHOLOGICAL,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a beneficiary', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      const result = await service.findOne('ben-1', tenantId);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if not found', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent', tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should restrict specialist to own beneficiaries', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(null);
      const specUser = makeUser(UserRole.SPECIALIST);

      await expect(service.findOne('ben-1', tenantId, specUser)).rejects.toThrow(
        NotFoundException,
      );
      expect(beneficiaryRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assignedSpecialistId: specialistId }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a beneficiary', async () => {
      beneficiaryRepo.findOne
        .mockResolvedValueOnce(makeBeneficiary())
        .mockResolvedValueOnce(makeBeneficiary());
      beneficiaryRepo.save.mockResolvedValue(makeBeneficiary());
      const user = makeUser();

      await service.update('ben-1', { firstName: 'Updated' } as any, tenantId, user);
      expect(beneficiaryRepo.save).toHaveBeenCalled();
    });

    it('should validate specialist on update', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('ben-1', { assignedSpecialistId: 'bad-spec' } as any, tenantId, makeUser()),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('assignSpecialist', () => {
    it('should assign a specialist', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      beneficiaryRepo.save.mockResolvedValue(makeBeneficiary());
      userRepo.findOne.mockResolvedValue(makeUser());

      const result = await service.assignSpecialist(
        'ben-1',
        { specialistId } as any,
        tenantId,
      );
      expect(beneficiaryRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if specialist invalid', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.assignSpecialist('ben-1', { specialistId: 'bad' } as any, tenantId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('changeStatus', () => {
    it('should change beneficiary status', async () => {
      beneficiaryRepo.findOne
        .mockResolvedValueOnce(makeBeneficiary())
        .mockResolvedValueOnce(makeBeneficiary({ status: BeneficiaryStatus.INACTIVE }));
      beneficiaryRepo.save.mockResolvedValue(makeBeneficiary());

      await service.changeStatus('ben-1', BeneficiaryStatus.INACTIVE, tenantId);
      expect(beneficiaryRepo.save).toHaveBeenCalled();
    });
  });

  describe('archive', () => {
    it('should archive a beneficiary', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      beneficiaryRepo.save.mockResolvedValue(makeBeneficiary());

      await service.archive('ben-1', tenantId);
      expect(beneficiaryRepo.save).toHaveBeenCalled();
    });
  });

  describe('getFile', () => {
    it('should return existing file', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      const file = { id: 'file-1', beneficiaryId: 'ben-1' } as any;
      fileRepo.findOne.mockResolvedValue(file);

      const result = await service.getFile('ben-1', tenantId);
      expect(result).toEqual(file);
    });

    it('should create file if not found', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      fileRepo.findOne.mockResolvedValueOnce(null);
      const newFile = { id: 'file-new' } as any;
      fileRepo.create.mockReturnValue(newFile);
      fileRepo.save.mockResolvedValue(newFile);

      const result = await service.getFile('ben-1', tenantId);
      expect(fileRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateFile', () => {
    it('should update file with goals', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      const file = { id: 'file-1', beneficiaryId: 'ben-1' } as any;
      fileRepo.findOne.mockResolvedValue(file);
      fileRepo.save.mockResolvedValue(file);

      const result = await service.updateFile(
        'ben-1',
        { goals: [{ id: '', description: 'Goal 1', targetDate: '2025-12-31', status: 'pending' }] } as any,
        tenantId,
        'user-1',
      );
      expect(fileRepo.save).toHaveBeenCalled();
    });

    it('should create file if not found during update', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      fileRepo.findOne.mockResolvedValueOnce(null);
      const newFile = { id: 'new-file' } as any;
      fileRepo.create.mockReturnValue(newFile);
      fileRepo.save.mockResolvedValue(newFile);

      await service.updateFile('ben-1', {} as any, tenantId, 'user-1');
      expect(fileRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ beneficiaryId: 'ben-1' }),
      );
    });
  });

  describe('getStats', () => {
    it('should return beneficiary stats', async () => {
      beneficiaryRepo.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80) // active
        .mockResolvedValueOnce(10) // completed
        .mockResolvedValueOnce(10); // archived

      const mockQb: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ caseType: 'psychological', count: '50' }]),
      };
      beneficiaryRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getStats(tenantId);
      expect(result).toEqual({
        total: 100,
        active: 80,
        completed: 10,
        archived: 10,
        byType: [{ caseType: 'psychological', count: '50' }],
      });
    });
  });
});
