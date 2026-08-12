import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, ILike, FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Beneficiary, BeneficiaryStatus, CaseType } from './beneficiary.entity';
import { BeneficiaryFile } from './beneficiary-file.entity';
import { User, UserRole } from '@modules/users/user.entity';
import {
  CreateBeneficiaryDto,
  UpdateBeneficiaryDto,
  BeneficiaryQueryDto,
  AssignSpecialistDto,
  UpdateBeneficiaryFileDto,
} from './dto/beneficiary.dto';

@Injectable()
export class BeneficiariesService {
  constructor(
    @InjectRepository(Beneficiary)
    private beneficiaryRepo: Repository<Beneficiary>,

    @InjectRepository(BeneficiaryFile)
    private fileRepo: Repository<BeneficiaryFile>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────

  async create(
    dto: CreateBeneficiaryDto,
    tenantId: string,
    createdById: string,
  ): Promise<Beneficiary> {
    // توليد رقم ملف فريد للمركز
    const fileNumber = await this.generateFileNumber(tenantId);

    // التحقق من أن الأخصائي المُعيَّن ينتمي لنفس المركز
    if (dto.assignedSpecialistId) {
      await this.validateSpecialistBelongsToTenant(dto.assignedSpecialistId, tenantId);
    }

    const beneficiary = this.beneficiaryRepo.create({
      ...dto,
      tenantId,
      createdById,
      fileNumber,
      intakeDate: dto.intakeDate ? new Date(dto.intakeDate) : new Date(),
    });

    const saved = await this.beneficiaryRepo.save(beneficiary);

    // إنشاء ملف إلكتروني فارغ تلقائياً مع كل مستفيد
    await this.fileRepo.save(
      this.fileRepo.create({
        beneficiaryId: saved.id,
        tenantId,
        createdById,
        goals: [],
        diagnosis: [],
      }),
    );

    return this.findOne(saved.id, tenantId);
  }

  // ─── READ ALL ─────────────────────────────────────────────

  async findAll(query: BeneficiaryQueryDto, tenantId: string, requestingUser: User) {
    const { search, status, caseType, specialistId, page = 1, limit = 20 } = query;

    const where: FindOptionsWhere<Beneficiary>[] | FindOptionsWhere<Beneficiary> = (() => {
      const base: FindOptionsWhere<Beneficiary> = { tenantId };
      if (status) base.status = status;
      if (caseType) base.caseType = caseType;

      // الأخصائي يرى حالاته فقط
      if (requestingUser.role === UserRole.SPECIALIST) {
        base.assignedSpecialistId = requestingUser.id;
      } else if (specialistId) {
        base.assignedSpecialistId = specialistId;
      }

      if (search) {
        return [
          { ...base, firstName: ILike(`%${search}%`) },
          { ...base, lastName: ILike(`%${search}%`) },
          { ...base, fileNumber: ILike(`%${search}%`) },
          { ...base, nationalId: ILike(`%${search}%`) },
        ];
      }
      return base;
    })();

    const [data, total] = await this.beneficiaryRepo.findAndCount({
      where,
      relations: ['assignedSpecialist', 'createdBy'],
      select: {
        assignedSpecialist: { id: true, firstName: true, lastName: true },
        createdBy: { id: true, firstName: true, lastName: true },
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── READ ONE ─────────────────────────────────────────────

  async findOne(id: string, tenantId: string, requestingUser?: User): Promise<Beneficiary> {
    const where: FindOptionsWhere<Beneficiary> = { id, tenantId };

    // الأخصائي يصل لحالاته فقط
    if (requestingUser?.role === UserRole.SPECIALIST) {
      where.assignedSpecialistId = requestingUser.id;
    }

    const beneficiary = await this.beneficiaryRepo.findOne({
      where,
      relations: ['assignedSpecialist', 'createdBy', 'tenant'],
      select: {
        assignedSpecialist: { id: true, firstName: true, lastName: true, email: true },
        createdBy: { id: true, firstName: true, lastName: true },
        tenant: { id: true, name: true },
      },
    });

    if (!beneficiary) throw new NotFoundException('المستفيد غير موجود');
    return beneficiary;
  }

  // ─── UPDATE ───────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateBeneficiaryDto,
    tenantId: string,
    requestingUser: User,
  ): Promise<Beneficiary> {
    const beneficiary = await this.findOne(id, tenantId, requestingUser);

    if (dto.assignedSpecialistId) {
      await this.validateSpecialistBelongsToTenant(dto.assignedSpecialistId, tenantId);
    }

    Object.assign(beneficiary, dto);
    await this.beneficiaryRepo.save(beneficiary);
    return this.findOne(id, tenantId);
  }

  // ─── ASSIGN SPECIALIST ────────────────────────────────────

  async assignSpecialist(
    id: string,
    dto: AssignSpecialistDto,
    tenantId: string,
    requestingUser?: User,
  ): Promise<Beneficiary> {
    const beneficiary = await this.findOne(id, tenantId);
    this.assertCanManageBeneficiary(requestingUser, beneficiary);
    await this.validateSpecialistBelongsToTenant(dto.specialistId, tenantId);

    beneficiary.assignedSpecialistId = dto.specialistId;
    await this.beneficiaryRepo.save(beneficiary);
    return this.findOne(id, tenantId);
  }

  // ─── STATUS CHANGE ────────────────────────────────────────

  async changeStatus(
    id: string,
    status: BeneficiaryStatus,
    tenantId: string,
    requestingUser?: User,
  ): Promise<Beneficiary> {
    const beneficiary = await this.findOne(id, tenantId);
    this.assertCanManageBeneficiary(requestingUser, beneficiary);
    beneficiary.status = status;
    await this.beneficiaryRepo.save(beneficiary);
    return this.findOne(id, tenantId);
  }

  // ─── SOFT DELETE (أرشفة) ──────────────────────────────────

  async archive(id: string, tenantId: string, requestingUser?: User): Promise<void> {
    const beneficiary = await this.findOne(id, tenantId);
    this.assertCanManageBeneficiary(requestingUser, beneficiary);
    beneficiary.status = BeneficiaryStatus.ARCHIVED;
    await this.beneficiaryRepo.save(beneficiary);
  }

  // ─── BENEFICIARY FILE ─────────────────────────────────────

  async getFile(
    beneficiaryId: string,
    tenantId: string,
    requestingUser?: User,
  ): Promise<BeneficiaryFile> {
    const beneficiary = await this.findOne(beneficiaryId, tenantId);
    this.assertCanManageBeneficiary(requestingUser, beneficiary);

    let file = await this.fileRepo.findOne({
      where: { beneficiaryId, tenantId },
      relations: ['createdBy'],
      select: { createdBy: { id: true, firstName: true, lastName: true } },
    });

    // إنشاء الملف إذا لم يكن موجوداً (حماية إضافية)
    if (!file) {
      file = await this.fileRepo.save(
        this.fileRepo.create({ beneficiaryId, tenantId, goals: [], diagnosis: [] }),
      );
    }

    return file;
  }

  async updateFile(
    beneficiaryId: string,
    dto: UpdateBeneficiaryFileDto,
    tenantId: string,
    updatedById: string,
    requestingUser?: User,
  ): Promise<BeneficiaryFile> {
    const beneficiary = await this.findOne(beneficiaryId, tenantId);
    this.assertCanManageBeneficiary(requestingUser, beneficiary);
    let file = await this.fileRepo.findOne({ where: { beneficiaryId, tenantId } });

    if (!file) {
      file = this.fileRepo.create({ beneficiaryId, tenantId, createdById: updatedById });
    }

    // دمج الأهداف الجديدة مع القديمة — UUID للأهداف الجديدة
    if (dto.goals) {
      dto.goals = dto.goals.map((g) => ({
        ...g,
        id: g.id || uuidv4(),
      }));
    }

    Object.assign(file, dto);
    return this.fileRepo.save(file);
  }

  // ─── STATISTICS ───────────────────────────────────────────

  async getStats(tenantId: string) {
    const [total, active, completed, archived] = await Promise.all([
      this.beneficiaryRepo.count({ where: { tenantId } }),
      this.beneficiaryRepo.count({ where: { tenantId, status: BeneficiaryStatus.ACTIVE } }),
      this.beneficiaryRepo.count({ where: { tenantId, status: BeneficiaryStatus.COMPLETED } }),
      this.beneficiaryRepo.count({ where: { tenantId, status: BeneficiaryStatus.ARCHIVED } }),
    ]);

    // توزيع حسب نوع الحالة
    const byType = await this.beneficiaryRepo
      .createQueryBuilder('b')
      .select('b.case_type', 'caseType')
      .addSelect('COUNT(*)', 'count')
      .where('b.tenant_id = :tenantId', { tenantId })
      .groupBy('b.case_type')
      .getRawMany();

    return { total, active, completed, archived, byType };
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────

  private async generateFileNumber(tenantId: string): Promise<string> {
    const count = await this.beneficiaryRepo.count({ where: { tenantId } });
    return `BNF-${String(count + 1).padStart(5, '0')}`;
  }

  private async validateSpecialistBelongsToTenant(
    specialistId: string,
    tenantId: string,
  ): Promise<void> {
    const specialist = await this.userRepo.findOne({
      where: { id: specialistId, tenantId, role: UserRole.SPECIALIST },
    });
    if (!specialist) {
      throw new BadRequestException('الأخصائي غير موجود أو لا ينتمي لهذا المركز');
    }
  }

  /**
   * الأخصائي يدير حالاته فقط — بقية الأدوار (استقبال/إدارة) تدير حالات المركز
   */
  private assertCanManageBeneficiary(requestingUser: User | undefined, beneficiary: Beneficiary): void {
    if (!requestingUser) return;
    if (
      requestingUser.role === UserRole.SPECIALIST &&
      beneficiary.assignedSpecialistId !== requestingUser.id
    ) {
      throw new ForbiddenException('لا يمكنك إدارة حالة مستفيد غير مسند إليك');
    }
  }
}
