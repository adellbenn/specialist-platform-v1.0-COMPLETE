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
import { PaymentsService } from './payments.service';
import {
  CreatePackageDto,
  UpdatePackageDto,
  CreateSubscriptionDto,
  SubscriptionQueryDto,
  CreateInvoiceDto,
  InvoiceQueryDto,
  MarkPaidDto,
} from './dto/payments.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { RbacGuard } from '@common/guards/rbac.guard';
import {
  AllStaff,
  WriterOnly,
  RequirePermissions,
  CurrentUser,
  TenantId,
} from '@common/decorators';
import { Permission } from '@common/permissions/permissions.enum';
import { User } from '@modules/users/user.entity';

@ApiTags('المدفوعات')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  // ═══════════════════════════════════════════
  // إحصائيات
  // ═══════════════════════════════════════════

  @Get('stats')
  @AllStaff()
  @RequirePermissions(Permission.PAYMENT_VIEW)
  @ApiOperation({ summary: 'إحصائيات المدفوعات' })
  async getStats(@TenantId() tenantId: string) {
    return { data: await this.service.getStats(tenantId) };
  }

  // ═══════════════════════════════════════════
  // SERVICE PACKAGES — باقات الخدمات
  // ═══════════════════════════════════════════

  @Post('packages')
  @WriterOnly()
  @RequirePermissions(Permission.PAYMENT_CREATE)
  @ApiOperation({ summary: 'إنشاء باقة خدمة' })
  async createPackage(@Body() dto: CreatePackageDto, @TenantId() tenantId: string) {
    const result = await this.service.createPackage(dto, tenantId);
    return { data: result, message: 'تم إنشاء الباقة بنجاح' };
  }

  @Get('packages')
  @AllStaff()
  @RequirePermissions(Permission.PAYMENT_VIEW)
  @ApiOperation({ summary: 'قائمة الباقات النشطة' })
  async getPackages(@TenantId() tenantId: string) {
    return { data: await this.service.findPackages(tenantId) };
  }

  @Get('packages/all')
  @RequirePermissions(Permission.PAYMENT_VIEW)
  @ApiOperation({ summary: 'جميع الباقات (إدارة)' })
  async getAllPackages(@TenantId() tenantId: string) {
    return { data: await this.service.findAllPackages(tenantId) };
  }

  @Put('packages/:id')
  @WriterOnly()
  @RequirePermissions(Permission.PAYMENT_UPDATE)
  @ApiOperation({ summary: 'تعديل باقة' })
  async updatePackage(
    @Param('id') id: string,
    @Body() dto: UpdatePackageDto,
    @TenantId() tenantId: string,
  ) {
    const result = await this.service.updatePackage(id, dto, tenantId);
    return { data: result, message: 'تم تعديل الباقة بنجاح' };
  }

  // ═══════════════════════════════════════════
  // SUBSCRIPTIONS — الاشتراكات
  // ═══════════════════════════════════════════

  @Post('subscriptions')
  @WriterOnly()
  @RequirePermissions(Permission.PAYMENT_CREATE)
  @ApiOperation({ summary: 'إنشاء اشتراك جديد' })
  async createSubscription(
    @Body() dto: CreateSubscriptionDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.service.createSubscription(dto, tenantId, user.id);
    return { data: result, message: 'تم إنشاء الاشتراك وإصدار الفاتورة بنجاح' };
  }

  @Get('subscriptions')
  @AllStaff()
  @RequirePermissions(Permission.PAYMENT_VIEW)
  @ApiOperation({ summary: 'قائمة الاشتراكات' })
  async getSubscriptions(@Query() query: SubscriptionQueryDto, @TenantId() tenantId: string) {
    return this.service.findSubscriptions(query, tenantId);
  }

  @Get('subscriptions/:id')
  @AllStaff()
  @RequirePermissions(Permission.PAYMENT_VIEW)
  @ApiOperation({ summary: 'تفاصيل اشتراك' })
  async getSubscription(@Param('id') id: string, @TenantId() tenantId: string) {
    return { data: await this.service.findSubscription(id, tenantId) };
  }

  @Get('subscriptions/beneficiary/:beneficiaryId/active')
  @AllStaff()
  @RequirePermissions(Permission.PAYMENT_VIEW)
  @ApiOperation({ summary: 'الاشتراك النشط للمستفيد' })
  async getActiveSubscription(
    @Param('beneficiaryId') beneficiaryId: string,
    @TenantId() tenantId: string,
  ) {
    const sub = await this.service.getActiveBeneficiarySubscription(beneficiaryId, tenantId);
    return { data: sub };
  }

  @Patch('subscriptions/:id/cancel')
  @WriterOnly()
  @RequirePermissions(Permission.PAYMENT_UPDATE)
  @ApiOperation({ summary: 'إلغاء اشتراك' })
  async cancelSubscription(@Param('id') id: string, @TenantId() tenantId: string) {
    const result = await this.service.cancelSubscription(id, tenantId);
    return { data: result, message: 'تم إلغاء الاشتراك' };
  }

  // ═══════════════════════════════════════════
  // INVOICES — الفواتير
  // ═══════════════════════════════════════════

  @Post('invoices')
  @WriterOnly()
  @RequirePermissions(Permission.PAYMENT_CREATE)
  @ApiOperation({ summary: 'إصدار فاتورة' })
  async createInvoice(
    @Body() dto: CreateInvoiceDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.service.createInvoice(dto, tenantId, user.id);
    return { data: result, message: 'تم إصدار الفاتورة بنجاح' };
  }

  @Get('invoices')
  @AllStaff()
  @RequirePermissions(Permission.PAYMENT_VIEW)
  @ApiOperation({ summary: 'قائمة الفواتير' })
  async getInvoices(@Query() query: InvoiceQueryDto, @TenantId() tenantId: string) {
    return this.service.findInvoices(query, tenantId);
  }

  @Get('invoices/:id')
  @AllStaff()
  @RequirePermissions(Permission.PAYMENT_VIEW)
  @ApiOperation({ summary: 'تفاصيل فاتورة' })
  async getInvoice(@Param('id') id: string, @TenantId() tenantId: string) {
    return { data: await this.service.findInvoice(id, tenantId) };
  }

  @Patch('invoices/:id/pay')
  @WriterOnly()
  @RequirePermissions(Permission.PAYMENT_UPDATE)
  @ApiOperation({ summary: 'تسجيل الدفع' })
  async markPaid(@Param('id') id: string, @Body() dto: MarkPaidDto, @TenantId() tenantId: string) {
    const result = await this.service.markAsPaid(id, dto, tenantId);
    return { data: result, message: 'تم تسجيل الدفع بنجاح' };
  }

  @Patch('invoices/:id/refund')
  @RequirePermissions(Permission.PAYMENT_UPDATE)
  @ApiOperation({ summary: 'استرداد فاتورة' })
  async refund(@Param('id') id: string, @TenantId() tenantId: string) {
    const result = await this.service.refund(id, tenantId);
    return { data: result, message: 'تم استرداد المبلغ' };
  }
}
