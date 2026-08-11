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
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentQueryDto,
} from './dto/appointment.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { RbacGuard } from '@common/guards/rbac.guard';
import {
  AllStaff,
  WriterOnly,
  StaffOrBeneficiary,
  RequirePermissions,
  CurrentUser,
  TenantId,
} from '@common/decorators';
import { Permission } from '@common/permissions/permissions.enum';
import { User } from '@modules/users/user.entity';
import { Session } from '@modules/sessions/session.entity';
import { CreateSessionDto } from '@modules/sessions/dto/session.dto';

@ApiTags('المواعيد')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  // ─── إنشاء ────────────────────────────────────────────────

  @Post()
  @WriterOnly()
  @RequirePermissions(Permission.APPOINTMENT_CREATE)
  @ApiOperation({ summary: 'إنشاء موعد جديد' })
  async create(
    @Body() dto: CreateAppointmentDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.service.create(dto, tenantId, user.id);
    return { data: result, message: 'تم إنشاء الموعد بنجاح' };
  }

  // ─── قائمة ────────────────────────────────────────────────

  @Get()
  @StaffOrBeneficiary()
  @RequirePermissions(Permission.APPOINTMENT_VIEW_ALL)
  @ApiOperation({ summary: 'قائمة المواعيد' })
  async findAll(
    @Query() query: AppointmentQueryDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.findAll(query, tenantId, user);
  }

  // ─── تقويم الشهر ─────────────────────────────────────────

  @Get('calendar')
  @StaffOrBeneficiary()
  @ApiOperation({ summary: 'بيانات التقويم الشهري' })
  async getCalendar(
    @Query('year') year: string,
    @Query('month') month: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
    @Query('specialistId') specialistId?: string,
    @Query('beneficiaryId') beneficiaryId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('location') location?: string,
  ) {
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    const filters: Record<string, any> = { specialistId, beneficiaryId, status, type, location };
    Object.keys(filters).forEach((k) => {
      if (!filters[k]) delete filters[k];
    });
    const result = await this.service.getCalendarData(y, m, tenantId, user, filters);
    return { data: result };
  }

  // ─── مواعيد اليوم ─────────────────────────────────────────

  @Get('today')
  @AllStaff()
  @ApiOperation({ summary: 'مواعيد اليوم' })
  async getToday(@TenantId() tenantId: string, @CurrentUser() user: User) {
    const specialistId = user.role === 'specialist' ? user.id : undefined;
    const result = await this.service.getTodayAppointments(tenantId, specialistId);
    return { data: result };
  }

  // ─── إحصائيات ─────────────────────────────────────────────

  @Get('stats')
  @AllStaff()
  @RequirePermissions(Permission.DASHBOARD_STATS)
  @ApiOperation({ summary: 'إحصائيات المواعيد' })
  async getStats(@TenantId() tenantId: string) {
    const result = await this.service.getStats(tenantId);
    return { data: result };
  }

  // ─── تفاصيل موعد ──────────────────────────────────────────

  @Get(':id')
  @StaffOrBeneficiary()
  @ApiOperation({ summary: 'تفاصيل موعد' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const result = await this.service.findOne(id, tenantId);
    return { data: result };
  }

  // ─── تعديل ────────────────────────────────────────────────

  @Put(':id')
  @WriterOnly()
  @RequirePermissions(Permission.APPOINTMENT_UPDATE)
  @ApiOperation({ summary: 'تعديل موعد' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @TenantId() tenantId: string,
  ) {
    const result = await this.service.update(id, dto, tenantId);
    return { data: result, message: 'تم تعديل الموعد بنجاح' };
  }

  // ─── تأكيد الموعد ─────────────────────────────────────────

  @Patch(':id/confirm')
  @WriterOnly()
  @RequirePermissions(Permission.APPOINTMENT_CONFIRM)
  @ApiOperation({ summary: 'تأكيد الموعد' })
  async confirm(@Param('id') id: string, @TenantId() tenantId: string) {
    const result = await this.service.confirm(id, tenantId);
    return { data: result, message: 'تم تأكيد الموعد' };
  }

  // ─── إلغاء الموعد ─────────────────────────────────────────

  @Patch(':id/cancel')
  @WriterOnly()
  @RequirePermissions(Permission.APPOINTMENT_CANCEL)
  @ApiOperation({ summary: 'إلغاء الموعد' })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @TenantId() tenantId: string,
  ) {
    const result = await this.service.cancel(id, reason, tenantId);
    return { data: result, message: 'تم إلغاء الموعد' };
  }

  // ─── عدم حضور ─────────────────────────────────────────────

  @Patch(':id/no-show')
  @WriterOnly()
  @RequirePermissions(Permission.APPOINTMENT_UPDATE)
  @ApiOperation({ summary: 'تسجيل عدم الحضور' })
  async markNoShow(@Param('id') id: string, @TenantId() tenantId: string) {
    const result = await this.service.markNoShow(id, tenantId);
    return { data: result, message: 'تم تسجيل عدم الحضور' };
  }

  // ─── إتمام الموعد + إنشاء جلسة ───────────────────────────

  @Patch(':id/complete')
  @WriterOnly()
  @RequirePermissions(Permission.SESSION_CREATE)
  @ApiOperation({ summary: 'إتمام الموعد وتسجيل الجلسة' })
  async complete(
    @Param('id') id: string,
    @Body() sessionDto: CreateSessionDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.service.complete(id, sessionDto, tenantId, user.id);
    return { data: result, message: 'تم تسجيل الجلسة بنجاح' };
  }
}
