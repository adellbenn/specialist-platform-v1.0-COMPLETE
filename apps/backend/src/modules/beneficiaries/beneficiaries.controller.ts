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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BeneficiariesService } from './beneficiaries.service';
import {
  CreateBeneficiaryDto,
  UpdateBeneficiaryDto,
  BeneficiaryQueryDto,
  AssignSpecialistDto,
  UpdateBeneficiaryFileDto,
} from './dto/beneficiary.dto';
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
  BeneficiaryId,
} from '@common/decorators';
import { Permission } from '@common/permissions/permissions.enum';
import { BeneficiaryStatus } from './beneficiary.entity';
import { User, UserRole } from '@modules/users/user.entity';

@ApiTags('المستفيدون')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('beneficiaries')
export class BeneficiariesController {
  constructor(private readonly service: BeneficiariesService) {}

  // ════════════════════════════════════════════════════════════
  // مسار المستفيد لنفسه
  // ════════════════════════════════════════════════════════════

  /**
   * المستفيد يعرض ملفه الشخصي
   * GET /beneficiaries/me
   */
  @Get('me')
  @RequirePermissions(Permission.BENEFICIARY_VIEW_SELF)
  @ApiOperation({ summary: 'المستفيد — ملفي الشخصي' })
  async getMyProfile(
    @CurrentUser() user: User,
    @TenantId() tenantId: string,
    @BeneficiaryId() beneficiaryId: string,
  ) {
    if (!beneficiaryId) return { data: null, message: 'لا يوجد ملف مرتبط بهذا الحساب' };
    const result = await this.service.findOne(beneficiaryId, tenantId, user);
    return { data: result };
  }

  /**
   * المستفيد يحدّث بياناته الشخصية المسموح بها
   * PATCH /beneficiaries/me
   */
  @Patch('me')
  @RequirePermissions(Permission.PROFILE_UPDATE_SELF)
  @ApiOperation({ summary: 'المستفيد — تحديث بياناتي' })
  async updateMyProfile(
    @Body() dto: UpdateBeneficiaryDto,
    @CurrentUser() user: User,
    @TenantId() tenantId: string,
    @BeneficiaryId() beneficiaryId: string,
  ) {
    // المستفيد يحدّث حقول محددة فقط
    const allowedFields = ['phone', 'email', 'address', 'guardianPhone'];
    const filteredDto = Object.fromEntries(
      Object.entries(dto).filter(([k]) => allowedFields.includes(k)),
    ) as UpdateBeneficiaryDto;

    const result = await this.service.update(beneficiaryId, filteredDto, tenantId, user);
    return { data: result, message: 'تم تحديث بياناتك بنجاح' };
  }

  // ════════════════════════════════════════════════════════════
  // إحصائيات — موظفو المركز فقط
  // ════════════════════════════════════════════════════════════

  @Get('stats')
  @AllStaff()
  @RequirePermissions(Permission.DASHBOARD_STATS)
  @ApiOperation({ summary: 'إحصائيات المستفيدين' })
  async getStats(@TenantId() tenantId: string) {
    const stats = await this.service.getStats(tenantId);
    return { data: stats };
  }

  // ════════════════════════════════════════════════════════════
  // إنشاء — الكاتبون فقط (أخصائي / استقبال)
  // ════════════════════════════════════════════════════════════

  @Post()
  @WriterOnly()
  @RequirePermissions(Permission.BENEFICIARY_CREATE)
  @ApiOperation({ summary: 'إنشاء مستفيد جديد' })
  async create(
    @Body() dto: CreateBeneficiaryDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.service.create(dto, tenantId, user.id);
    return { data: result, message: 'تم إنشاء ملف المستفيد بنجاح' };
  }

  // ════════════════════════════════════════════════════════════
  // قائمة — الجميع مع فلترة تلقائية حسب الدور
  // ════════════════════════════════════════════════════════════

  @Get()
  @AllStaff()
  @RequirePermissions(Permission.BENEFICIARY_VIEW_ALL, Permission.BENEFICIARY_VIEW_OWN)
  @ApiOperation({ summary: 'قائمة المستفيدين' })
  async findAll(
    @Query() query: BeneficiaryQueryDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.findAll(query, tenantId, user);
  }

  // ════════════════════════════════════════════════════════════
  // تفاصيل — موظفون + المستفيد نفسه
  // ════════════════════════════════════════════════════════════

  @Get(':id')
  @StaffOrBeneficiary()
  @ApiOperation({ summary: 'تفاصيل مستفيد' })
  async findOne(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
    @BeneficiaryId() myBeneficiaryId: string,
  ) {
    // المستفيد يرى نفسه فقط
    if (user.role === UserRole.BENEFICIARY && id !== myBeneficiaryId) {
      throw new ForbiddenException('لا يمكنك مشاهدة بيانات مستفيد آخر');
    }
    const result = await this.service.findOne(id, tenantId, user);
    return { data: result };
  }

  // ════════════════════════════════════════════════════════════
  // تعديل — الكاتبون فقط
  // ════════════════════════════════════════════════════════════

  @Put(':id')
  @WriterOnly()
  @RequirePermissions(Permission.BENEFICIARY_UPDATE)
  @ApiOperation({ summary: 'تعديل بيانات مستفيد' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBeneficiaryDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.service.update(id, dto, tenantId, user);
    return { data: result, message: 'تم تعديل بيانات المستفيد بنجاح' };
  }

  @Patch(':id/assign')
  @WriterOnly()
  @RequirePermissions(Permission.BENEFICIARY_ASSIGN)
  @ApiOperation({ summary: 'تعيين أخصائي للحالة' })
  async assignSpecialist(
    @Param('id') id: string,
    @Body() dto: AssignSpecialistDto,
    @TenantId() tenantId: string,
  ) {
    const result = await this.service.assignSpecialist(id, dto, tenantId);
    return { data: result, message: 'تم تعيين الأخصائي بنجاح' };
  }

  @Patch(':id/status')
  @WriterOnly()
  @RequirePermissions(Permission.BENEFICIARY_UPDATE)
  @ApiOperation({ summary: 'تغيير حالة المستفيد' })
  async changeStatus(
    @Param('id') id: string,
    @Body('status') status: BeneficiaryStatus,
    @TenantId() tenantId: string,
  ) {
    const result = await this.service.changeStatus(id, status, tenantId);
    return { data: result, message: 'تم تعديل الحالة بنجاح' };
  }

  @Delete(':id')
  @WriterOnly()
  @RequirePermissions(Permission.BENEFICIARY_ARCHIVE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'أرشفة مستفيد' })
  async archive(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.service.archive(id, tenantId);
    return { message: 'تم أرشفة المستفيد بنجاح' };
  }

  // ════════════════════════════════════════════════════════════
  // الملف الإلكتروني
  // ════════════════════════════════════════════════════════════

  @Get(':id/file')
  @StaffOrBeneficiary()
  @RequirePermissions(Permission.FILE_VIEW)
  @ApiOperation({ summary: 'الملف الإلكتروني' })
  async getFile(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
    @BeneficiaryId() myBeneficiaryId: string,
  ) {
    if (user.role === UserRole.BENEFICIARY && id !== myBeneficiaryId) {
      throw new ForbiddenException('لا يمكنك مشاهدة ملف مستفيد آخر');
    }
    const result = await this.service.getFile(id, tenantId);
    return { data: result };
  }

  @Patch(':id/file')
  @WriterOnly()
  @RequirePermissions(Permission.FILE_UPDATE)
  @ApiOperation({ summary: 'تعديل الملف الإلكتروني' })
  async updateFile(
    @Param('id') id: string,
    @Body() dto: UpdateBeneficiaryFileDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.service.updateFile(id, dto, tenantId, user.id);
    return { data: result, message: 'تم تعديل الملف الإلكتروني بنجاح' };
  }
}
