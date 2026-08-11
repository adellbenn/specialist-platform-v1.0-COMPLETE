import { Controller, Get, Query, UseGuards, Injectable, Module } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditLog, AuditAction } from './audit-log.entity';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { RequirePermissions, CurrentUser, TenantId } from '@common/decorators';
import { Permission } from '@common/permissions/permissions.enum';

// ═══════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════

interface LogDto {
  userId?: string;
  tenantId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async log(dto: LogDto): Promise<void> {
    try {
      await this.auditRepo.save(this.auditRepo.create(dto));
    } catch {
      // لا تُوقف الـ request إذا فشل التسجيل
    }
  }

  async findAll(query: {
    tenantId?: string;
    userId?: string;
    action?: AuditAction;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, userId, action, entityType, dateFrom, dateTo, page = 1, limit = 30 } = query;

    const qb = this.auditRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.user', 'user')
      .orderBy('a.created_at', 'DESC');

    if (tenantId) qb.andWhere('a.tenant_id = :tenantId', { tenantId });
    if (userId) qb.andWhere('a.user_id = :userId', { userId });
    if (action) qb.andWhere('a.action = :action', { action });
    if (entityType) qb.andWhere('a.entity_type = :entityType', { entityType });
    if (dateFrom) qb.andWhere('a.created_at >= :from', { from: new Date(dateFrom) });
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59);
      qb.andWhere('a.created_at <= :to', { to: end });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}

// ═══════════════════════════════════════
// CONTROLLER
// ═══════════════════════════════════════

@ApiTags('سجل النشاطات')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly service: AuditLogService) {}

  @Get()
  @RequirePermissions(Permission.AUDIT_VIEW)
  @ApiOperation({ summary: 'سجل نشاطات المركز' })
  async findAll(
    @Query('userId') userId: string,
    @Query('action') action: AuditAction,
    @Query('entityType') entityType: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @TenantId() tenantId: string,
  ) {
    return this.service.findAll({
      tenantId,
      userId,
      action,
      entityType,
      dateFrom,
      dateTo,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 30,
    });
  }
}

// ═══════════════════════════════════════
// MODULE
// ═══════════════════════════════════════

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
