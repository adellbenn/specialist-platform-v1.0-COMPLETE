import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { FileAttachment, EntityType } from './file-attachment.entity';
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
    tenantId: string,
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
    const subDir = path.join(this.uploadDir, tenantId, entityType, datePath);
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
    const relPath = path.join(tenantId, entityType, datePath, fileName);

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
    tenantId: string,
  ): Promise<FileAttachment[]> {
    return this.fileRepo.find({
      where: { entityType, entityId, tenantId },
      relations: ['uploadedBy'],
      select: {
        uploadedBy: { id: true, firstName: true, lastName: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── GET ALL FILES (مع pagination) ────────────────────────

  async findAll(
    tenantId: string,
    options: { page?: number; limit?: number; mimeType?: string } = {},
  ) {
    const { page = 1, limit = 24, mimeType } = options;
    const where: any = { tenantId };

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
    tenantId: string,
  ): Promise<{ file: FileAttachment; absolutePath: string }> {
    const file = await this.fileRepo.findOne({ where: { id, tenantId } });
    if (!file) throw new NotFoundException('الملف غير موجود');

    const absolutePath = path.join(path.resolve(this.uploadDir), file.filePath);

    // التحقق من وجود الملف
    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException('الملف غير موجود على الخادم');
    }

    return { file, absolutePath };
  }

  // ─── DELETE ───────────────────────────────────────────────

  async delete(id: string, tenantId: string): Promise<void> {
    const file = await this.fileRepo.findOne({ where: { id, tenantId } });
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
