import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CreateTenantDto, UpdateTenantDto, TenantQueryDto } from './dto/tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const existingSlug = await this.tenantRepository.findOne({
      where: { slug: dto.slug },
    });
    if (existingSlug) throw new ConflictException('هذا المعرف (slug) مستخدم مسبقاً');

    const existingName = await this.tenantRepository.findOne({
      where: { name: dto.name },
    });
    if (existingName) throw new ConflictException('اسم المركز مستخدم مسبقاً');

    const tenant = this.tenantRepository.create(dto);
    return this.tenantRepository.save(tenant);
  }

  async findAll(query: TenantQueryDto) {
    const { search, isActive, page = 1, limit = 20 } = query;
    const where: any = {};

    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await this.tenantRepository.findAndCount({
      where: search ? [{ ...where, name: Like(`%${search}%`) }] : where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('المركز غير موجود');
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { slug } });
    if (!tenant) throw new NotFoundException('المركز غير موجود');
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);

    if (dto.slug && dto.slug !== tenant.slug) {
      const existing = await this.tenantRepository.findOne({ where: { slug: dto.slug } });
      if (existing) throw new ConflictException('هذا المعرف (slug) مستخدم مسبقاً');
    }

    Object.assign(tenant, dto);
    return this.tenantRepository.save(tenant);
  }

  async toggleActive(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.isActive = !tenant.isActive;
    return this.tenantRepository.save(tenant);
  }

  async getStats(id: string) {
    const tenant = await this.findOne(id);
    const db = this.dataSource;

    const [
      totalUsers,
      activeUsers,
      totalBeneficiaries,
      activeBeneficiaries,
      totalAppointments,
      upcomingAppointments,
      totalInvoices,
      revenueResult,
    ] = await Promise.all([
      db
        .query('SELECT COUNT(*) as cnt FROM users WHERE tenant_id = ?', [id])
        .then((r) => Number(r[0]?.cnt ?? 0)),
      db
        .query('SELECT COUNT(*) as cnt FROM users WHERE tenant_id = ? AND is_active = 1', [id])
        .then((r) => Number(r[0]?.cnt ?? 0)),
      db
        .query('SELECT COUNT(*) as cnt FROM beneficiaries WHERE tenant_id = ?', [id])
        .then((r) => Number(r[0]?.cnt ?? 0)),
      db
        .query(
          "SELECT COUNT(*) as cnt FROM beneficiaries WHERE tenant_id = ? AND status = 'ACTIVE'",
          [id],
        )
        .then((r) => Number(r[0]?.cnt ?? 0)),
      db
        .query('SELECT COUNT(*) as cnt FROM appointments WHERE tenant_id = ?', [id])
        .then((r) => Number(r[0]?.cnt ?? 0)),
      db
        .query(
          "SELECT COUNT(*) as cnt FROM appointments WHERE tenant_id = ? AND status = 'SCHEDULED'",
          [id],
        )
        .then((r) => Number(r[0]?.cnt ?? 0)),
      db
        .query('SELECT COUNT(*) as cnt FROM invoices WHERE tenant_id = ?', [id])
        .then((r) => Number(r[0]?.cnt ?? 0)),
      db
        .query(
          "SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE tenant_id = ? AND payment_status = 'PAID'",
          [id],
        )
        .then((r) => Number(r[0]?.total ?? 0)),
    ]);

    return {
      tenant,
      stats: {
        totalUsers,
        activeUsers,
        totalBeneficiaries,
        activeBeneficiaries,
        totalAppointments,
        upcomingAppointments,
        totalInvoices,
        totalRevenue: revenueResult,
        utilizationRate:
          tenant.maxUsers > 0 ? Math.round((activeUsers / tenant.maxUsers) * 100) : 0,
        beneficiaryUtilization:
          tenant.maxBeneficiaries > 0
            ? Math.round((activeBeneficiaries / tenant.maxBeneficiaries) * 100)
            : 0,
      },
    };
  }
}
