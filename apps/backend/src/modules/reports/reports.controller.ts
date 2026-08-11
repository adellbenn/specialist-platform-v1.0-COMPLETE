import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import {
  CreateReportDto,
  UpdateReportDto,
  ReportQueryDto,
  ApproveReportDto,
} from './dto/report.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { RbacGuard } from '@common/guards/rbac.guard';
import {
  AllStaff,
  WriterOnly,
  StaffOrBeneficiary,
  AdminOnly,
  RequirePermissions,
  CurrentUser,
  TenantId,
} from '@common/decorators';
import { Permission } from '@common/permissions/permissions.enum';
import { User } from '@modules/users/user.entity';

@ApiTags('التقارير')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  // ─── إنشاء تقرير — أخصائي فقط ────────────────────────────

  @Post()
  @WriterOnly()
  @RequirePermissions(Permission.REPORT_CREATE)
  @ApiOperation({ summary: 'إنشاء تقرير جديد' })
  async create(
    @Body() dto: CreateReportDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.service.create(dto, tenantId, user.id);
    return { data: result, message: 'تم إنشاء التقرير بنجاح' };
  }

  // ─── قائمة التقارير ───────────────────────────────────────

  @Get()
  @StaffOrBeneficiary()
  @RequirePermissions(Permission.REPORT_VIEW_OWN)
  @ApiOperation({ summary: 'قائمة التقارير' })
  async findAll(
    @Query() query: ReportQueryDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.findAll(query, tenantId, user);
  }

  // ─── إحصائيات ─────────────────────────────────────────────

  @Get('stats')
  @AllStaff()
  @RequirePermissions(Permission.DASHBOARD_STATS)
  @ApiOperation({ summary: 'إحصائيات التقارير' })
  async getStats(@TenantId() tenantId: string) {
    return { data: await this.service.getStats(tenantId) };
  }

  // ─── تفاصيل تقرير ─────────────────────────────────────────

  @Get(':id')
  @StaffOrBeneficiary()
  @RequirePermissions(Permission.REPORT_VIEW_OWN)
  @ApiOperation({ summary: 'تفاصيل تقرير' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string, @CurrentUser() user: User) {
    return { data: await this.service.findOne(id, tenantId, user) };
  }

  // ─── تعديل تقرير — أخصائي فقط ────────────────────────────

  @Put(':id')
  @WriterOnly()
  @RequirePermissions(Permission.REPORT_UPDATE)
  @ApiOperation({ summary: 'تعديل تقرير' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.service.update(id, dto, tenantId, user);
    return { data: result, message: 'تم تعديل التقرير بنجاح' };
  }

  // ─── تقديم التقرير للمراجعة ───────────────────────────────

  @Patch(':id/submit')
  @WriterOnly()
  @RequirePermissions(Permission.REPORT_UPDATE)
  @ApiOperation({ summary: 'تقديم التقرير للمراجعة' })
  async submit(@Param('id') id: string, @TenantId() tenantId: string, @CurrentUser() user: User) {
    const result = await this.service.submit(id, tenantId, user);
    return { data: result, message: 'تم تقديم التقرير للمراجعة' };
  }

  // ─── الموافقة على التقرير — مشرف وأعلى ───────────────────

  @Patch(':id/approve')
  @RequirePermissions(Permission.REPORT_APPROVE)
  @ApiOperation({ summary: 'الموافقة على التقرير' })
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveReportDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.service.approve(id, dto, tenantId, user.id);
    return { data: result, message: 'تم الموافقة على التقرير' };
  }

  // ─── مشاركة التقرير مع المستفيد ──────────────────────────

  @Patch(':id/toggle-share')
  @AllStaff()
  @RequirePermissions(Permission.REPORT_UPDATE)
  @ApiOperation({ summary: 'مشاركة/إلغاء مشاركة التقرير مع المستفيد' })
  async toggleShare(@Param('id') id: string, @TenantId() tenantId: string) {
    const result = await this.service.toggleShare(id, tenantId);
    const msg = result.sharedWithBeneficiary
      ? 'تم مشاركة التقرير مع المستفيد'
      : 'تم إلغاء المشاركة';
    return { data: result, message: msg };
  }

  // ─── أرشفة تقرير ──────────────────────────────────────────

  @Delete(':id')
  @AllStaff()
  @RequirePermissions(Permission.REPORT_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'أرشفة تقرير' })
  async archive(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.service.archive(id, tenantId);
    return { message: 'تم أرشفة التقرير' };
  }
}
