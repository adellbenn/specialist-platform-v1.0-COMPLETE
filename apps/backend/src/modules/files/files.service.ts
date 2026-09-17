import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { FileAttachment, EntityType } from './file-attachment.entity';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';
import { Report } from '@modules/reports/report.entity';
import { Session } from '@modules/sessions/session.entity';
import { Invoice } from '@modules/payments/invoice.entity';
import { User, UserRole } from '@modules/users/user.entity';
import { VirusScannerService } from '@common/security/virus-scanner.service';

/** أنواع الملفات المسموح بها */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadDir: string;
  private readonly maxFileSize: number;

  constructor(
    @InjectRepository(FileAttachment)
    private fileRepo: Repository<FileAttachment>,
    @InjectRepository(Beneficiary)
    private beneficiaryRepo: Repository<Beneficiary>,
    @InjectRepository(Report)
    private reportRepo: Repository<Report>,
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
    private configService: ConfigService,
    private virusScanner: VirusScannerService,
  ) {
    this.uploadDir = this.configService.get<string>('storage.localPath') ?? './uploads';
    const maxFileSize = this.configService.get<number>('storage.maxFileSize');
    this.maxFileSize =
      typeof maxFileSize === 'number' && maxFileSize > 0
        ? maxFileSize
        : DEFAULT_MAX_FILE_SIZE;
    this.ensureUploadDir();
  }

  // ─── UPLOAD ───────────────────────────────────────────────

  async upload(
    file: Express.Multer.File,
    entityType: EntityType,
    entityId: string,
    tenantId: string | null,
    uploadedById: string,
  ): Promise<FileAttachment> {
    this.validateFile(file);

    // Virus scan before writing to disk
    const scanResult = await this.virusScanner.scanBuffer(file.buffer, file.originalname);
    if (!scanResult.clean) {
      this.logger.warn(
        `Virus detected in ${file.originalname}: ${scanResult.virus} — upload rejected`,
      );
      throw new BadRequestException(`File rejected: virus detected (${scanResult.virus})`);
    }
    if (scanResult.error) {
      this.logger.warn(`Virus scan skipped: ${scanResult.error}`);
    }

    // هيكل المجلدات: uploads/{tenantId}/{entityType}/{YYYY-MM}/
    const datePath = new Date().toISOString().slice(0, 7); // YYYY-MM
    // Super Admin (بدون مركز) يستخدم مجلد "system" بدلاً من tenantId فارغ
    const tenantDir = tenantId ?? 'system';
    const subDir = path.join(this.uploadDir, tenantDir, entityType, datePath);
    const safeDir = path.resolve(subDir);

    // منع path traversal
    if (!safeDir.startsWith(path.resolve(this.uploadDir))) {
      throw new BadRequestException('مسار غير صالح');
    }

    fs.mkdirSync(safeDir, { recursive: true });

    // اسم فريد للملف
    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(safeDir, fileName);
    const relPath = path.join(tenantDir, entityType, datePath, fileName);

    fs.writeFileSync(filePath, file.buffer);

    const attachment = this.fileRepo.create({
      tenantId,
      entityType,
      entityId,
      fileName,
      filePath: relPath,
      fileSize: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
      uploadedById,
    });

    return this.fileRepo.save(attachment);
  }

  // ─── GET FILES FOR ENTITY ─────────────────────────────────

  async getEntityFiles(
    entityType: EntityType,
    entityId: string,
    tenantId: string | null,
  ): Promise<FileAttachment[]> {
    return this.fileRepo.find({
      where: {
        entityType,
        entityId,
        tenantId: tenantId ?? IsNull(),
      },
      relations: ['uploadedBy'],
      select: {
        uploadedBy: { id: true, firstName: true, lastName: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── GET ALL FILES (مع pagination) ────────────────────────

  async findAll(
    tenantId: string | null,
    options: { page?: number; limit?: number; mimeType?: string } = {},
  ) {
    const { page = 1, limit = 24, mimeType } = options;
    const where: any = { tenantId: tenantId ?? IsNull() };

    if (mimeType) {
      where.mimeType = mimeType;
    }

    const [data, total] = await this.fileRepo.findAndCount({
      where,
      relations: ['uploadedBy'],
      select: {
        uploadedBy: { id: true, firstName: true, lastName: true },
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

  // ─── GET FILE PATH (للتحميل) ──────────────────────────────

  async getFilePath(
    id: string,
    tenantId: string | null,
    requestingUser?: User,
  ): Promise<{ file: FileAttachment; absolutePath: string }> {
    const file = await this.fileRepo.findOne({
      where: { id, tenantId: tenantId ?? IsNull() },
    });
    if (!file) throw new NotFoundException('الملف غير موجود');

    // التحقق من الصلاحيات وفهرس الملكية للأخصائيين
    if (requestingUser?.role === UserRole.SPECIALIST) {
      const effective = await this.checkSpecialistFileAccess(file, requestingUser.id);
      if (!effective) {
        throw new ForbiddenException('لا يمكنك تحميل هذا الملف لانه ليس ملكاً لك');
      }
    }

    const absolutePath = path.join(path.resolve(this.uploadDir), file.filePath);

    // التحقق من وجود الملف
    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException('الملف غير موجود على الخادم');
    }

    return { file, absolutePath };
  }

  /** unified scope check for specialist-owned files */
  private async checkSpecialistFileAccess(
    file: FileAttachment, specialistId: string,
  ): Promise<boolean> {
    // ملفات Super Admin (بدون مركز) ليست مملوكة لأخصائي
    if (!file.tenantId) return false;

    switch (file.entityType) {
      case EntityType.BENEFICIARY: {
        const beneficiary = await this.beneficiaryRepo.findOne({
          where: { id: file.entityId, tenantId: file.tenantId },
          relations: ['assignedSpecialist'],
        });
        if (!beneficiary || beneficiary.assignedSpecialistId !== specialistId) return false;
        return true;
      }
      case EntityType.REPORT: {
        const report = await this.reportRepo.findOne({
          where: { id: file.entityId, tenantId: file.tenantId },
        });
        if (!report || report.specialistId !== specialistId) return false;
        return true;
      }
      case EntityType.SESSION: {
        const session = await this.sessionRepo.findOne({
          where: { id: file.entityId, tenantId: file.tenantId },
          relations: ['specialist'],
        });
        if (!session || session.specialistId !== specialistId) return false;
        return true;
      }
      case EntityType.INVOICE: {
        // الأخصائيون ليس لديهم صلاحية عرض فواتير
        return false;
      }
      default:
        return true; // لإدارة المركز والمحاسب يفحص rbac السابق
    }
  }

  // ─── DELETE ───────────────────────────────────────────────

  async delete(id: string, tenantId: string | null): Promise<void> {
    const file = await this.fileRepo.findOne({
      where: { id, tenantId: tenantId ?? IsNull() },
    });
    if (!file) throw new NotFoundException('الملف غير موجود');

    // حذف الملف الفعلي
    const absolutePath = path.join(path.resolve(this.uploadDir), file.filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await this.fileRepo.remove(file);
  }

  // ─── PRIVATE ──────────────────────────────────────────────

  private validateFile(file: Express.Multer.File): void {
    if (!file) throw new BadRequestException('لم يتم رفع أي ملف');

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `حجم الملف يتجاوز الحد المسموح (${Math.round(this.maxFileSize / 1024 / 1024)}MB)`,
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'نوع الملف غير مسموح به. الأنواع المدعومة: PDF, Word, Excel, الصور',
      );
    }
  }

  private ensureUploadDir(): void {
    try {
      fs.mkdirSync(path.resolve(this.uploadDir), { recursive: true });
    } catch (err) {
      this.logger.error('فشل إنشاء مجلد الرفع', err);
    }
  }
}
