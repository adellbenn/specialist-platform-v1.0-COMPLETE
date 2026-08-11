import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TenantsService } from '../tenants.service';
import { Tenant } from '../tenant.entity';

describe('TenantsService', () => {
  let service: TenantsService;
  let tenantRepo: jest.Mocked<Repository<Tenant>>;
  let dataSource: jest.Mocked<DataSource>;

  const makeTenant = (overrides: Partial<Tenant> = {}): Tenant =>
    ({
      id: 'tenant-1',
      name: 'Test Center',
      slug: 'test-center',
      type: 'clinic' as any,
      subscriptionPlan: 'professional' as any,
      subscriptionExpiresAt: null,
      maxUsers: 10,
      maxBeneficiaries: 100,
      settings: null,
      logoUrl: null,
      address: null,
      phone: null,
      email: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Tenant;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TenantsService);
    tenantRepo = module.get(getRepositoryToken(Tenant));
    dataSource = module.get(DataSource);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create a tenant', async () => {
      tenantRepo.findOne.mockResolvedValue(null);
      tenantRepo.create.mockReturnValue(makeTenant());
      tenantRepo.save.mockResolvedValue(makeTenant());

      const result = await service.create({ name: 'Test Center', slug: 'test-center' } as any);
      expect(result).toBeDefined();
      expect(tenantRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate slug', async () => {
      tenantRepo.findOne.mockResolvedValueOnce(makeTenant());
      await expect(
        service.create({ name: 'New', slug: 'test-center' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException for duplicate name', async () => {
      tenantRepo.findOne
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValueOnce(makeTenant()); // name check

      await expect(
        service.create({ name: 'Test Center', slug: 'new-slug' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated tenants', async () => {
      tenantRepo.findAndCount.mockResolvedValue([[makeTenant()], 1]);
      const result = await service.findAll({});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by isActive', async () => {
      tenantRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.findAll({ isActive: true } as any);
      expect(tenantRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should search by name', async () => {
      tenantRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.findAll({ search: 'Test' } as any);
      expect(tenantRepo.findAndCount).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a tenant', async () => {
      tenantRepo.findOne.mockResolvedValue(makeTenant());
      const result = await service.findOne('tenant-1');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if not found', async () => {
      tenantRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return a tenant by slug', async () => {
      tenantRepo.findOne.mockResolvedValue(makeTenant());
      const result = await service.findBySlug('test-center');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if not found', async () => {
      tenantRepo.findOne.mockResolvedValue(null);
      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a tenant', async () => {
      tenantRepo.findOne
        .mockResolvedValueOnce(makeTenant()) // findOne for existing
        .mockResolvedValueOnce(null); // slug conflict check
      tenantRepo.save.mockResolvedValue(makeTenant());

      const result = await service.update('tenant-1', { name: 'Updated' } as any);
      expect(tenantRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if slug conflicts', async () => {
      tenantRepo.findOne
        .mockResolvedValueOnce(makeTenant())
        .mockResolvedValueOnce(makeTenant({ id: 'other' }));

      await expect(
        service.update('tenant-1', { slug: 'existing-slug' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should not check slug conflict if slug unchanged', async () => {
      tenantRepo.findOne.mockResolvedValueOnce(makeTenant({ slug: 'same-slug' }));
      tenantRepo.save.mockResolvedValue(makeTenant());

      await service.update('tenant-1', { slug: 'same-slug' } as any);
      expect(tenantRepo.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('toggleActive', () => {
    it('should toggle tenant active status', async () => {
      tenantRepo.findOne.mockResolvedValue(makeTenant({ isActive: true }));
      tenantRepo.save.mockResolvedValue(makeTenant({ isActive: false }));

      const result = await service.toggleActive('tenant-1');
      expect(result.isActive).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return tenant stats', async () => {
      tenantRepo.findOne.mockResolvedValue(makeTenant({ maxUsers: 10, maxBeneficiaries: 100 }));

      dataSource.query
        .mockResolvedValueOnce([{ cnt: 5 }])   // totalUsers
        .mockResolvedValueOnce([{ cnt: 4 }])   // activeUsers
        .mockResolvedValueOnce([{ cnt: 20 }])  // totalBeneficiaries
        .mockResolvedValueOnce([{ cnt: 15 }])  // activeBeneficiaries
        .mockResolvedValueOnce([{ cnt: 50 }])  // totalAppointments
        .mockResolvedValueOnce([{ cnt: 10 }])  // upcomingAppointments
        .mockResolvedValueOnce([{ cnt: 30 }])  // totalInvoices
        .mockResolvedValueOnce([{ total: '5000' }]); // revenue

      const result = await service.getStats('tenant-1');
      expect(result.stats.totalUsers).toBe(5);
      expect(result.stats.activeUsers).toBe(4);
      expect(result.stats.totalBeneficiaries).toBe(20);
      expect(result.stats.activeBeneficiaries).toBe(15);
      expect(result.stats.totalAppointments).toBe(50);
      expect(result.stats.upcomingAppointments).toBe(10);
      expect(result.stats.totalInvoices).toBe(30);
      expect(result.stats.totalRevenue).toBe(5000);
      expect(result.stats.utilizationRate).toBe(40);
      expect(result.stats.beneficiaryUtilization).toBe(15);
    });

    it('should return 0 utilization if max is 0', async () => {
      tenantRepo.findOne.mockResolvedValue(makeTenant({ maxUsers: 0, maxBeneficiaries: 0 }));
      dataSource.query.mockResolvedValue([{ cnt: 0 }]);

      const result = await service.getStats('tenant-1');
      expect(result.stats.utilizationRate).toBe(0);
      expect(result.stats.beneficiaryUtilization).toBe(0);
    });
  });
});
