import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PaymentsService } from '../payments.service';
import { ServicePackage } from '../service-package.entity';
import { Subscription, SubscriptionStatus } from '../subscription.entity';
import { Invoice, PaymentStatus, PaymentMethod } from '../invoice.entity';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let packageRepo: jest.Mocked<Repository<ServicePackage>>;
  let subscriptionRepo: jest.Mocked<Repository<Subscription>>;
  let invoiceRepo: jest.Mocked<Repository<Invoice>>;
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

  const makePackage = (overrides: Partial<ServicePackage> = {}): ServicePackage =>
    ({
      id: 'pkg-1',
      tenantId,
      name: 'Basic Package',
      sessionsCount: 12,
      price: 500,
      durationMonths: 3,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as ServicePackage;

  const makeSubscription = (overrides: Partial<Subscription> = {}): Subscription =>
    ({
      id: 'sub-1',
      tenantId,
      beneficiaryId: 'ben-1',
      packageId: 'pkg-1',
      sessionsUsed: 0,
      sessionsRemaining: 12,
      amountPaid: 500,
      discountAmount: 0,
      startDate: new Date('2025-01-01'),
      expiryDate: new Date('2025-04-01'),
      status: SubscriptionStatus.ACTIVE,
      createdById: 'user-1',
      beneficiary: { id: 'ben-1', firstName: 'Ahmed', lastName: 'Ali', fileNumber: 'BNF-00001' } as any,
      package: { id: 'pkg-1', name: 'Basic', sessionsCount: 12 } as any,
      createdBy: { id: 'user-1', firstName: 'Admin', lastName: 'User' } as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Subscription;

  const makeInvoice = (overrides: Partial<Invoice> = {}): Invoice =>
    ({
      id: 'inv-1',
      tenantId,
      invoiceNumber: 'INV-2025-0001',
      beneficiaryId: 'ben-1',
      subscriptionId: null,
      amount: 500,
      discount: 0,
      tax: 0,
      total: 500,
      paymentMethod: null,
      paymentStatus: PaymentStatus.PENDING,
      paidAt: null,
      notes: null,
      createdById: 'user-1',
      beneficiary: { id: 'ben-1', firstName: 'Ahmed', lastName: 'Ali', fileNumber: 'BNF-00001' } as any,
      subscription: null,
      createdBy: { id: 'user-1', firstName: 'Admin', lastName: 'User' } as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Invoice;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(ServicePackage),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Invoice),
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
          provide: getRepositoryToken(Beneficiary),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(PaymentsService);
    packageRepo = module.get(getRepositoryToken(ServicePackage));
    subscriptionRepo = module.get(getRepositoryToken(Subscription));
    invoiceRepo = module.get(getRepositoryToken(Invoice));
    beneficiaryRepo = module.get(getRepositoryToken(Beneficiary));
  });

  afterEach(() => jest.clearAllMocks());

  describe('createPackage', () => {
    it('should create a package', async () => {
      packageRepo.create.mockReturnValue(makePackage());
      packageRepo.save.mockResolvedValue(makePackage());

      const result = await service.createPackage({ name: 'Basic', sessionsCount: 12, price: 500 } as any, tenantId);
      expect(result).toBeDefined();
      expect(packageRepo.save).toHaveBeenCalled();
    });
  });

  describe('findPackages', () => {
    it('should return active packages', async () => {
      packageRepo.find.mockResolvedValue([makePackage()]);
      const result = await service.findPackages(tenantId);
      expect(result).toHaveLength(1);
      expect(packageRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isActive: true }) }),
      );
    });
  });

  describe('findAllPackages', () => {
    it('should return all packages', async () => {
      packageRepo.find.mockResolvedValue([makePackage()]);
      const result = await service.findAllPackages(tenantId);
      expect(result).toHaveLength(1);
    });
  });

  describe('updatePackage', () => {
    it('should update a package', async () => {
      packageRepo.findOne.mockResolvedValue(makePackage());
      packageRepo.save.mockResolvedValue(makePackage());

      const result = await service.updatePackage('pkg-1', { name: 'Updated' } as any, tenantId);
      expect(packageRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if package not found', async () => {
      packageRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updatePackage('nonexistent', {} as any, tenantId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createSubscription', () => {
    it('should create a subscription', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      subscriptionRepo.findOne.mockResolvedValueOnce(null);
      subscriptionRepo.create.mockReturnValue(makeSubscription());
      subscriptionRepo.save.mockResolvedValue(makeSubscription());
      subscriptionRepo.findOne.mockResolvedValueOnce(makeSubscription());
      invoiceRepo.count.mockResolvedValue(0);
      invoiceRepo.create.mockReturnValue(makeInvoice());
      invoiceRepo.save.mockResolvedValue(makeInvoice());

      const result = await service.createSubscription(
        {
          beneficiaryId: 'ben-1',
          packageId: 'pkg-1',
          sessionsCount: 12,
          amountPaid: 500,
          startDate: '2025-01-01',
          expiryDate: '2025-04-01',
        } as any,
        tenantId,
        'user-1',
      );
      expect(result).toBeDefined();
    });

    it('should scope the beneficiary lookup to the tenant', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      subscriptionRepo.findOne.mockResolvedValueOnce(null);
      subscriptionRepo.create.mockReturnValue(makeSubscription());
      subscriptionRepo.save.mockResolvedValue(makeSubscription());
      subscriptionRepo.findOne.mockResolvedValueOnce(makeSubscription());
      invoiceRepo.count.mockResolvedValue(0);
      invoiceRepo.create.mockReturnValue(makeInvoice());
      invoiceRepo.save.mockResolvedValue(makeInvoice());

      await service.createSubscription(
        {
          beneficiaryId: 'ben-1',
          packageId: 'pkg-1',
          sessionsCount: 12,
          amountPaid: 500,
          startDate: '2025-01-01',
          expiryDate: '2025-04-01',
        } as any,
        tenantId,
        'user-1',
      );
      expect(beneficiaryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'ben-1', tenantId },
      });
    });

    it('should throw BadRequestException when beneficiary does not exist', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createSubscription(
          {
            beneficiaryId: 'ben-missing',
            packageId: 'pkg-1',
            sessionsCount: 12,
            amountPaid: 500,
            startDate: '2025-01-01',
            expiryDate: '2025-04-01',
          } as any,
          tenantId,
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(subscriptionRepo.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when beneficiary does not belong to the tenant', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createSubscription(
          {
            beneficiaryId: 'ben-other-tenant',
            packageId: 'pkg-1',
            sessionsCount: 12,
            amountPaid: 500,
            startDate: '2025-01-01',
            expiryDate: '2025-04-01',
          } as any,
          tenantId,
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when beneficiaryId is missing', async () => {
      await expect(
        service.createSubscription(
          {
            packageId: 'pkg-1',
            sessionsCount: 12,
            amountPaid: 500,
            startDate: '2025-01-01',
            expiryDate: '2025-04-01',
          } as any,
          tenantId,
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(beneficiaryRepo.findOne).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if active subscription exists', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      subscriptionRepo.findOne.mockResolvedValueOnce(makeSubscription());

      await expect(
        service.createSubscription(
          {
            beneficiaryId: 'ben-1',
            packageId: 'pkg-1',
            sessionsCount: 12,
            amountPaid: 500,
            startDate: '2025-01-01',
            expiryDate: '2025-04-01',
          } as any,
          tenantId,
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findSubscriptions', () => {
    it('should return paginated subscriptions', async () => {
      subscriptionRepo.findAndCount.mockResolvedValue([[makeSubscription()], 1]);
      const result = await service.findSubscriptions({}, tenantId);
      expect(result.data).toHaveLength(1);
    });

    it('should filter by beneficiaryId and status', async () => {
      subscriptionRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.findSubscriptions(
        { beneficiaryId: 'ben-1', status: SubscriptionStatus.ACTIVE } as any,
        tenantId,
      );
      expect(subscriptionRepo.findAndCount).toHaveBeenCalled();
    });
  });

  describe('findSubscription', () => {
    it('should return a subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(makeSubscription());
      const result = await service.findSubscription('sub-1', tenantId);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if not found', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);
      await expect(service.findSubscription('nonexistent', tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getActiveBeneficiarySubscription', () => {
    it('should return active subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(makeSubscription());
      const result = await service.getActiveBeneficiarySubscription('ben-1', tenantId);
      expect(result).toBeDefined();
    });

    it('should return null if no active subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);
      const result = await service.getActiveBeneficiarySubscription('ben-1', tenantId);
      expect(result).toBeNull();
    });
  });

  describe('consumeSession', () => {
    it('should decrement sessionsRemaining', async () => {
      const sub = makeSubscription({ sessionsRemaining: 5, sessionsUsed: 7 });
      subscriptionRepo.findOne.mockResolvedValue(sub);
      subscriptionRepo.save.mockResolvedValue(sub);

      await service.consumeSession('ben-1', tenantId);
      expect(sub.sessionsUsed).toBe(8);
      expect(sub.sessionsRemaining).toBe(4);
      expect(subscriptionRepo.save).toHaveBeenCalled();
    });

    it('should mark subscription as completed when sessions run out', async () => {
      const sub = makeSubscription({ sessionsRemaining: 1, sessionsUsed: 11 });
      subscriptionRepo.findOne.mockResolvedValue(sub);
      subscriptionRepo.save.mockResolvedValue(sub);

      await service.consumeSession('ben-1', tenantId);
      expect(sub.status).toBe(SubscriptionStatus.COMPLETED);
    });

    it('should do nothing if no active subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);
      await service.consumeSession('ben-1', tenantId);
      expect(subscriptionRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel an active subscription', async () => {
      const sub = makeSubscription({ status: SubscriptionStatus.ACTIVE });
      subscriptionRepo.findOne.mockResolvedValue(sub);
      subscriptionRepo.save.mockResolvedValue(sub);

      const result = await service.cancelSubscription('sub-1', tenantId);
      expect(sub.status).toBe(SubscriptionStatus.CANCELLED);
    });

    it('should throw BadRequestException if not active', async () => {
      const sub = makeSubscription({ status: SubscriptionStatus.COMPLETED });
      subscriptionRepo.findOne.mockResolvedValue(sub);

      await expect(service.cancelSubscription('sub-1', tenantId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createInvoice', () => {
    it('should create an invoice', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      invoiceRepo.count.mockResolvedValue(0);
      invoiceRepo.create.mockReturnValue(makeInvoice());
      invoiceRepo.save.mockResolvedValue(makeInvoice());
      invoiceRepo.findOne.mockResolvedValue(makeInvoice());

      const result = await service.createInvoice(
        {
          beneficiaryId: 'ben-1',
          amount: 500,
          discount: 0,
          tax: 0,
        } as any,
        tenantId,
        'user-1',
      );
      expect(result).toBeDefined();
    });

    it('should scope the beneficiary lookup to the tenant', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      invoiceRepo.count.mockResolvedValue(0);
      invoiceRepo.create.mockReturnValue(makeInvoice());
      invoiceRepo.save.mockResolvedValue(makeInvoice());
      invoiceRepo.findOne.mockResolvedValue(makeInvoice());

      await service.createInvoice(
        { beneficiaryId: 'ben-1', amount: 500 } as any,
        tenantId,
        'user-1',
      );
      expect(beneficiaryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'ben-1', tenantId },
      });
    });

    it('should throw BadRequestException when beneficiary does not exist', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createInvoice(
          { beneficiaryId: 'ben-missing', amount: 500 } as any,
          tenantId,
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(invoiceRepo.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when beneficiary does not belong to the tenant', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createInvoice(
          { beneficiaryId: 'ben-other-tenant', amount: 500 } as any,
          tenantId,
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when beneficiaryId is missing', async () => {
      await expect(
        service.createInvoice({ amount: 500 } as any, tenantId, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(beneficiaryRepo.findOne).not.toHaveBeenCalled();
    });

    it('should set paidAt if status is PAID', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      invoiceRepo.count.mockResolvedValue(0);
      invoiceRepo.create.mockReturnValue(makeInvoice());
      invoiceRepo.save.mockResolvedValue(makeInvoice());
      invoiceRepo.findOne.mockResolvedValue(makeInvoice());

      await service.createInvoice(
        {
          beneficiaryId: 'ben-1',
          amount: 500,
          paymentStatus: PaymentStatus.PAID,
        } as any,
        tenantId,
        'user-1',
      );
      expect(invoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ paidAt: expect.any(Date) }),
      );
    });

    it('should calculate total with discount and tax', async () => {
      beneficiaryRepo.findOne.mockResolvedValue(makeBeneficiary());
      invoiceRepo.count.mockResolvedValue(0);
      invoiceRepo.create.mockReturnValue(makeInvoice());
      invoiceRepo.save.mockResolvedValue(makeInvoice());
      invoiceRepo.findOne.mockResolvedValue(makeInvoice());

      await service.createInvoice(
        { beneficiaryId: 'ben-1', amount: 100, discount: 10, tax: 5 } as any,
        tenantId,
        'user-1',
      );
      expect(invoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ total: 95 }),
      );
    });
  });

  describe('findInvoices', () => {
    it('should return paginated invoices', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[makeInvoice()], 1]),
      };
      invoiceRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findInvoices({}, tenantId);
      expect(result.data).toHaveLength(1);
    });

    it('should apply filters', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      invoiceRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findInvoices(
        {
          beneficiaryId: 'ben-1',
          paymentStatus: PaymentStatus.PAID,
          dateFrom: '2025-01-01',
          dateTo: '2025-12-31',
        } as any,
        tenantId,
      );
      expect(qb.andWhere).toHaveBeenCalled();
    });
  });

  describe('findInvoice', () => {
    it('should return an invoice', async () => {
      invoiceRepo.findOne.mockResolvedValue(makeInvoice());
      const result = await service.findInvoice('inv-1', tenantId);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if not found', async () => {
      invoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.findInvoice('nonexistent', tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAsPaid', () => {
    it('should mark invoice as paid', async () => {
      const inv = makeInvoice({ paymentStatus: PaymentStatus.PENDING });
      invoiceRepo.findOne.mockResolvedValue(inv);
      invoiceRepo.save.mockResolvedValue(inv);

      const result = await service.markAsPaid(
        'inv-1',
        { paymentMethod: PaymentMethod.CASH } as any,
        tenantId,
      );
      expect(inv.paymentStatus).toBe(PaymentStatus.PAID);
      expect(inv.paymentMethod).toBe(PaymentMethod.CASH);
    });

    it('should throw BadRequestException if already paid', async () => {
      const inv = makeInvoice({ paymentStatus: PaymentStatus.PAID });
      invoiceRepo.findOne.mockResolvedValue(inv);

      await expect(
        service.markAsPaid('inv-1', { paymentMethod: PaymentMethod.CASH } as any, tenantId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set notes if provided', async () => {
      const inv = makeInvoice({ paymentStatus: PaymentStatus.PENDING });
      invoiceRepo.findOne.mockResolvedValue(inv);
      invoiceRepo.save.mockResolvedValue(inv);

      await service.markAsPaid(
        'inv-1',
        { paymentMethod: PaymentMethod.CARD, notes: 'Thank you' } as any,
        tenantId,
      );
      expect(inv.notes).toBe('Thank you');
    });
  });

  describe('refund', () => {
    it('should refund a paid invoice', async () => {
      const inv = makeInvoice({ paymentStatus: PaymentStatus.PAID });
      invoiceRepo.findOne.mockResolvedValue(inv);
      invoiceRepo.save.mockResolvedValue(inv);

      const result = await service.refund('inv-1', tenantId);
      expect(inv.paymentStatus).toBe(PaymentStatus.REFUNDED);
    });

    it('should throw BadRequestException if not paid', async () => {
      const inv = makeInvoice({ paymentStatus: PaymentStatus.PENDING });
      invoiceRepo.findOne.mockResolvedValue(inv);

      await expect(service.refund('inv-1', tenantId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStats', () => {
    it('should return payment stats', async () => {
      invoiceRepo.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(20);

      subscriptionRepo.count.mockResolvedValue(10);

      const mockQb: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '5000' }),
      };
      invoiceRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getStats(tenantId);
      expect(result.totalInvoices).toBe(100);
      expect(result.paidInvoices).toBe(80);
      expect(result.pendingInvoices).toBe(20);
      expect(result.activeSubscriptions).toBe(10);
      expect(result.totalRevenue).toBe(5000);
      expect(result.monthRevenue).toBe(5000);
    });
  });
});
