import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus, ReportType } from './report.entity';
import { User, UserRole } from '@modules/users/user.entity';
import {
  CreateReportDto,
  UpdateReportDto,
  ReportQueryDto,
  ApproveReportDto,
} from './dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepo: Repository<Report>,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────

  async create(dto: CreateReportDto, tenantId: string, specialistId: string): Promise<Report> {
    const report = this.reportRepo.create({
      ...dto,
      tenantId,
      specialistId,
      periodFrom: dto.periodFrom ? new Date(dto.periodFrom) : undefined,
      periodTo: dto.periodTo ? new Date(dto.periodTo) : undefined,
      content: dto.content ?? {},
      status: ReportStatus.DRAFT,
    });

    const saved = await this.reportRepo.save(report);
    return this.findOne(saved.id, tenantId);
  }

  // ─── READ ALL ─────────────────────────────────────────────

  async findAll(query: ReportQueryDto, tenantId: string, requestingUser: User) {
    const { beneficiaryId, specialistId, type, status, page = 1, limit = 20 } = query;

    const qb = this.reportRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.beneficiary', 'beneficiary')
      .leftJoinAndSelect('r.specialist', 'specialist')
      .leftJoinAndSelect('r.approvedBy', 'approvedBy')
      .where('r.tenant_id = :tenantId', { tenantId });

    // الأخصائي يرى تقاريره فقط
    if (requestingUser.role === UserRole.SPECIALIST) {
      qb.andWhere('r.specialist_id = :sid', { sid: requestingUser.id });
    } else if (specialistId) {
      qb.andWhere('r.specialist_id = :sid', { sid: specialistId });
    }

    // المستفيد يرى التقارير المشاركة معه فقط
    if (requestingUser.role === UserRole.BENEFICIARY) {
      qb.andWhere('r.beneficiary_id = :bid', { bid: requestingUser.beneficiaryId })
        .andWhere('r.shared_with_beneficiary = true')
        .andWhere('r.status = :status', { status: ReportStatus.APPROVED });
    } else if (beneficiaryId) {
      qb.andWhere('r.beneficiary_id = :bid', { bid: beneficiaryId });
    }

    if (type) qb.andWhere('r.type = :type', { type });
    if (status) qb.andWhere('r.status = :status', { status });

    const [data, total] = await qb
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ─── READ ONE ─────────────────────────────────────────────

  async findOne(id: string, tenantId: string, requestingUser?: User): Promise<Report> {
    const report = await this.reportRepo.findOne({
      where: { id, tenantId },
      relations: ['beneficiary', 'specialist', 'approvedBy'],
      select: {
        beneficiary: { id: true, firstName: true, lastName: true, fileNumber: true },
        specialist: { id: true, firstName: true, lastName: true },
        approvedBy: { id: true, firstName: true, lastName: true },
      },
    });

    if (!report) throw new NotFoundException('التقرير غير موجود');

    // المستفيد يصل للتقارير المشاركة معه فقط
    if (requestingUser?.role === UserRole.BENEFICIARY) {
      if (!report.sharedWithBeneficiary || report.status !== ReportStatus.APPROVED) {
        throw new ForbiddenException('لا يمكنك الوصول لهذا التقرير');
      }
    }

    // الأخصائي يصل لتقاريره فقط
    if (requestingUser?.role === UserRole.SPECIALIST) {
      if (report.specialistId !== requestingUser.id) {
        throw new ForbiddenException('لا يمكنك الوصول لتقرير أخصائي آخر');
      }
    }

    return report;
  }

  // ─── UPDATE ───────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateReportDto,
    tenantId: string,
    requestingUser: User,
  ): Promise<Report> {
    const report = await this.findOne(id, tenantId);

    // الأخصائي يعدّل تقاريره فقط وفي حالة draft
    if (requestingUser.role === UserRole.SPECIALIST) {
      if (report.specialistId !== requestingUser.id) {
        throw new ForbiddenException('لا يمكنك تعديل تقرير أخصائي آخر');
      }
      if (report.status === ReportStatus.APPROVED) {
        throw new BadRequestException('لا يمكن تعديل تقرير موافق عليه');
      }
    }

    Object.assign(report, {
      ...dto,
      periodFrom: dto.periodFrom ? new Date(dto.periodFrom) : report.periodFrom,
      periodTo: dto.periodTo ? new Date(dto.periodTo) : report.periodTo,
    });

    await this.reportRepo.save(report);
    return this.findOne(id, tenantId);
  }

  // ─── SUBMIT ───────────────────────────────────────────────

  async submit(id: string, tenantId: string, requestingUser: User): Promise<Report> {
    const report = await this.findOne(id, tenantId);

    if (report.specialistId !== requestingUser.id) {
      throw new ForbiddenException('لا يمكنك تقديم تقرير أخصائي آخر');
    }
    if (report.status !== ReportStatus.DRAFT) {
      throw new BadRequestException('يمكن تقديم التقارير في حالة المسودة فقط');
    }

    report.status = ReportStatus.SUBMITTED;
    await this.reportRepo.save(report);
    return this.findOne(id, tenantId);
  }

  // ─── APPROVE ──────────────────────────────────────────────

  async approve(
    id: string,
    dto: ApproveReportDto,
    tenantId: string,
    approverId: string,
  ): Promise<Report> {
    const report = await this.findOne(id, tenantId);

    if (report.status !== ReportStatus.SUBMITTED) {
      throw new BadRequestException('يمكن الموافقة على التقارير المقدمة فقط');
    }

    report.status = ReportStatus.APPROVED;
    report.approvedById = approverId;
    report.approvedAt = new Date();

    await this.reportRepo.save(report);
    return this.findOne(id, tenantId);
  }

  // ─── SHARE WITH BENEFICIARY ───────────────────────────────

  async toggleShare(id: string, tenantId: string, requestingUser?: User): Promise<Report> {
    const report = await this.findOne(id, tenantId);

    if (report.status !== ReportStatus.APPROVED) {
      throw new BadRequestException('يمكن مشاركة التقارير الموافق عليها فقط');
    }

    // الأخصائي يشارك تقاريره فقط — موظف الاستقبال/المحاسب لا يشاركون التقارير
    if (requestingUser) {
      if (requestingUser.role === UserRole.SPECIALIST) {
        if (report.specialistId !== requestingUser.id) {
          throw new ForbiddenException('لا يمكنك مشاركة تقرير أخصائي آخر');
        }
      } else if (
        requestingUser.role === UserRole.RECEPTIONIST ||
        requestingUser.role === UserRole.ACCOUNTANT
      ) {
        throw new ForbiddenException('لا تملك صلاحية مشاركة التقارير');
      }
    }

    report.sharedWithBeneficiary = !report.sharedWithBeneficiary;
    await this.reportRepo.save(report);
    return this.findOne(id, tenantId);
  }

  // ─── ARCHIVE ──────────────────────────────────────────────

  async archive(id: string, tenantId: string, requestingUser?: User): Promise<void> {
    const report = await this.findOne(id, tenantId);

    if (requestingUser?.role === UserRole.SPECIALIST) {
      if (report.specialistId !== requestingUser.id) {
        throw new ForbiddenException('لا يمكنك أرشفة تقرير أخصائي آخر');
      }
    }

    report.status = ReportStatus.ARCHIVED;
    await this.reportRepo.save(report);
  }

  // ─── STATS ────────────────────────────────────────────────

  async getStats(tenantId: string) {
    const [total, drafts, submitted, approved, archived] = await Promise.all([
      this.reportRepo.count({ where: { tenantId } }),
      this.reportRepo.count({ where: { tenantId, status: ReportStatus.DRAFT } }),
      this.reportRepo.count({ where: { tenantId, status: ReportStatus.SUBMITTED } }),
      this.reportRepo.count({ where: { tenantId, status: ReportStatus.APPROVED } }),
      this.reportRepo.count({ where: { tenantId, status: ReportStatus.ARCHIVED } }),
    ]);

    // توزيع حسب النوع
    const byType = await this.reportRepo
      .createQueryBuilder('r')
      .select('r.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('r.tenant_id = :tenantId', { tenantId })
      .groupBy('r.type')
      .getRawMany();

    return { total, drafts, submitted, approved, archived, byType };
  }
}
