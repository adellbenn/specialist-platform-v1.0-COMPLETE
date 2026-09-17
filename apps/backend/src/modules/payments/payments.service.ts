import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, FindOptionsWhere } from 'typeorm';
import { ServicePackage } from './service-package.entity';
import { Subscription, SubscriptionStatus } from './subscription.entity';
import { Invoice, PaymentStatus, PaymentMethod } from './invoice.entity';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';
import {
  CreatePackageDto,
  UpdatePackageDto,
  CreateSubscriptionDto,
  SubscriptionQueryDto,
  CreateInvoiceDto,
  InvoiceQueryDto,
  MarkPaidDto,
} from './dto/payments.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(ServicePackage)
    private packageRepo: Repository<ServicePackage>,

    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,

    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,

    @InjectRepository(Beneficiary)
    private beneficiaryRepo: Repository<Beneficiary>,
  ) {}

  // ═══════════════════════════════════════════
  // SERVICE PACKAGES
  // ═══════════════════════════════════════════

  async createPackage(dto: CreatePackageDto, tenantId: string): Promise<ServicePackage> {
    const pkg = this.packageRepo.create({ ...dto, tenantId });
    return this.packageRepo.save(pkg);
  }

  async findPackages(tenantId: string): Promise<ServicePackage[]> {
    return this.packageRepo.find({
      where: { tenantId, isActive: true },
      order: { price: 'ASC' },
    });
  }

  async findAllPackages(tenantId: string): Promise<ServicePackage[]> {
    return this.packageRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async updatePackage(
    id: string,
    dto: UpdatePackageDto,
    tenantId: string,
  ): Promise<ServicePackage> {
    const pkg = await this.packageRepo.findOne({ where: { id, tenantId } });
    if (!pkg) throw new NotFoundException('الباقة غير موجودة');
    Object.assign(pkg, dto);
    return this.packageRepo.save(pkg);
  }

  // ═══════════════════════════════════════════
  // SUBSCRIPTIONS
  // ═══════════════════════════════════════════

  async createSubscription(
    dto: CreateSubscriptionDto,
    tenantId: string,
    createdById: string,
  ): Promise<Subscription> {
    if (!dto.beneficiaryId) {
      throw new BadRequestException('المستفيد غير موجود في هذا المركز');
    }
    const beneficiary = await this.beneficiaryRepo.findOne({
      where: { id: dto.beneficiaryId, tenantId },
    });
    if (!beneficiary) throw new BadRequestException('المستفيد غير موجود في هذا المركز');

    // التحقق من عدم وجود اشتراك نشط للمستفيد
    const existing = await this.subscriptionRepo.findOne({
      where: {
        beneficiaryId: dto.beneficiaryId,
        tenantId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (existing) {
      throw new ConflictException(
        `للمستفيد اشتراك نشط حتى ${new Date(existing.expiryDate).toLocaleDateString('ar-SA')} بـ ${existing.sessionsRemaining} جلسة متبقية`,
      );
    }

    const sub = this.subscriptionRepo.create({
      ...dto,
      tenantId,
      createdById,
      sessionsRemaining: dto.sessionsCount,
      startDate: new Date(dto.startDate),
      expiryDate: new Date(dto.expiryDate),
    });

    const saved = await this.subscriptionRepo.save(sub);

    // إنشاء فاتورة تلقائياً
    await this.createInvoiceForSubscription(saved, tenantId, createdById);

    return this.findSubscription(saved.id, tenantId);
  }

  async findSubscriptions(query: SubscriptionQueryDto, tenantId: string) {
    const { beneficiaryId, status, page = 1, limit = 20 } = query;
    const where: FindOptionsWhere<Subscription> = { tenantId };
    if (beneficiaryId) where.beneficiaryId = beneficiaryId;
    if (status) where.status = status as SubscriptionStatus;

    const [data, total] = await this.subscriptionRepo.findAndCount({
      where,
      relations: ['beneficiary', 'package', 'createdBy'],
      select: {
        beneficiary: { id: true, firstName: true, lastName: true, fileNumber: true },
        package: { id: true, name: true, sessionsCount: true },
        createdBy: { id: true, firstName: true, lastName: true },
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findSubscription(id: string, tenantId: string): Promise<Subscription> {
    const sub = await this.subscriptionRepo.findOne({
      where: { id, tenantId },
      relations: ['beneficiary', 'package', 'createdBy'],
    });
    if (!sub) throw new NotFoundException('الاشتراك غير موجود');
    return sub;
  }

  async getActiveBeneficiarySubscription(
    beneficiaryId: string,
    tenantId: string,
  ): Promise<Subscription | null> {
    return this.subscriptionRepo.findOne({
      where: { beneficiaryId, tenantId, status: SubscriptionStatus.ACTIVE },
      relations: ['package'],
    });
  }

  /** تُستدعى عند إتمام جلسة لخصم جلسة من الاشتراك */
  async consumeSession(beneficiaryId: string, tenantId: string): Promise<void> {
    const sub = await this.getActiveBeneficiarySubscription(beneficiaryId, tenantId);
    if (!sub) return;

    sub.sessionsUsed += 1;
    sub.sessionsRemaining -= 1;

    if (sub.sessionsRemaining <= 0) {
      sub.status = SubscriptionStatus.COMPLETED;
    }

    await this.subscriptionRepo.save(sub);
  }

  async cancelSubscription(id: string, tenantId: string): Promise<Subscription> {
    const sub = await this.findSubscription(id, tenantId);
    if (sub.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('يمكن إلغاء الاشتراكات النشطة فقط');
    }
    sub.status = SubscriptionStatus.CANCELLED;
    await this.subscriptionRepo.save(sub);
    return this.findSubscription(id, tenantId);
  }

  // ═══════════════════════════════════════════
  // INVOICES
  // ═══════════════════════════════════════════

  async createInvoice(
    dto: CreateInvoiceDto,
    tenantId: string,
    createdById: string,
  ): Promise<Invoice> {
    if (!dto.beneficiaryId) {
      throw new BadRequestException('المستفيد غير موجود في هذا المركز');
    }
    const beneficiary = await this.beneficiaryRepo.findOne({
      where: { id: dto.beneficiaryId, tenantId },
    });
    if (!beneficiary) throw new BadRequestException('المستفيد غير موجود في هذا المركز');

    const invoiceNumber = await this.generateInvoiceNumber(tenantId);
    const total = Number(dto.amount) - Number(dto.discount ?? 0) + Number(dto.tax ?? 0);

    const invoice = this.invoiceRepo.create({
      ...dto,
      tenantId,
      createdById,
      invoiceNumber,
      total,
      paidAt: dto.paymentStatus === PaymentStatus.PAID ? new Date() : undefined,
    });

    const saved = await this.invoiceRepo.save(invoice);
    return this.findInvoice(saved.id, tenantId);
  }

  async findInvoices(query: InvoiceQueryDto, tenantId: string) {
    const { beneficiaryId, paymentStatus, dateFrom, dateTo, page = 1, limit = 20 } = query;

    const qb = this.invoiceRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.beneficiary', 'beneficiary')
      .leftJoinAndSelect('i.subscription', 'subscription')
      .leftJoinAndSelect('i.createdBy', 'createdBy')
      .where('i.tenant_id = :tenantId', { tenantId });

    if (beneficiaryId) qb.andWhere('i.beneficiary_id = :bid', { bid: beneficiaryId });
    if (paymentStatus) qb.andWhere('i.payment_status = :ps', { ps: paymentStatus });
    if (dateFrom) qb.andWhere('i.created_at >= :from', { from: new Date(dateFrom) });
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59);
      qb.andWhere('i.created_at <= :to', { to: end });
    }

    const [data, total] = await qb
      .orderBy('i.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findInvoice(id: string, tenantId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id, tenantId },
      relations: ['beneficiary', 'subscription', 'createdBy'],
      select: {
        beneficiary: { id: true, firstName: true, lastName: true, fileNumber: true },
        createdBy: { id: true, firstName: true, lastName: true },
      },
    });
    if (!invoice) throw new NotFoundException('الفاتورة غير موجودة');
    return invoice;
  }

  async markAsPaid(id: string, dto: MarkPaidDto, tenantId: string): Promise<Invoice> {
    const invoice = await this.findInvoice(id, tenantId);
    if (invoice.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('الفاتورة مدفوعة مسبقاً');
    }
    invoice.paymentStatus = PaymentStatus.PAID;
    invoice.paymentMethod = dto.paymentMethod;
    invoice.paidAt = new Date();
    if (dto.notes) invoice.notes = dto.notes;

    await this.invoiceRepo.save(invoice);
    return this.findInvoice(id, tenantId);
  }

  async refund(id: string, tenantId: string): Promise<Invoice> {
    const invoice = await this.findInvoice(id, tenantId);
    if (invoice.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('يمكن استرداد الفواتير المدفوعة فقط');
    }
    invoice.paymentStatus = PaymentStatus.REFUNDED;
    await this.invoiceRepo.save(invoice);
    return this.findInvoice(id, tenantId);
  }

  // ═══════════════════════════════════════════
  // STATISTICS
  // ═══════════════════════════════════════════

  async getStats(tenantId: string) {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalInvoices, paidInvoices, pendingInvoices, activeSubscriptions] = await Promise.all([
      this.invoiceRepo.count({ where: { tenantId } }),
      this.invoiceRepo.count({ where: { tenantId, paymentStatus: PaymentStatus.PAID } }),
      this.invoiceRepo.count({ where: { tenantId, paymentStatus: PaymentStatus.PENDING } }),
      this.subscriptionRepo.count({ where: { tenantId, status: SubscriptionStatus.ACTIVE } }),
    ]);

    // إجمالي الإيرادات
    const revenueResult = await this.invoiceRepo
      .createQueryBuilder('i')
      .select('SUM(i.total)', 'total')
      .where('i.tenant_id = :tenantId', { tenantId })
      .andWhere('i.payment_status = :status', { status: PaymentStatus.PAID })
      .getRawOne();

    const monthRevenueResult = await this.invoiceRepo
      .createQueryBuilder('i')
      .select('SUM(i.total)', 'total')
      .where('i.tenant_id = :tenantId', { tenantId })
      .andWhere('i.payment_status = :status', { status: PaymentStatus.PAID })
      .andWhere('i.paid_at >= :from', { from: monthStart })
      .getRawOne();

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      activeSubscriptions,
      totalRevenue: Number(revenueResult?.total ?? 0),
      monthRevenue: Number(monthRevenueResult?.total ?? 0),
    };
  }

  // ═══════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);
    const count = await this.invoiceRepo.count({
      where: {
        tenantId,
        createdAt: MoreThanOrEqual(yearStart) as any,
      },
    });
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async createInvoiceForSubscription(
    sub: Subscription,
    tenantId: string,
    createdById: string,
  ): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);
    const amount = Number(sub.amountPaid) + Number(sub.discountAmount);
    const total = Number(sub.amountPaid);

    const invoice = this.invoiceRepo.create({
      tenantId,
      createdById,
      invoiceNumber,
      beneficiaryId: sub.beneficiaryId,
      subscriptionId: sub.id,
      amount,
      discount: Number(sub.discountAmount),
      tax: 0,
      total,
      paymentStatus: PaymentStatus.PAID,
      paidAt: new Date(),
    });

    return this.invoiceRepo.save(invoice);
  }
}
