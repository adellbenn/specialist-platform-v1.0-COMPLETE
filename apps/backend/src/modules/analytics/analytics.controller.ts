import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { RbacGuard } from '@common/guards/rbac.guard';
import { AllStaff, RequirePermissions, CurrentUser, TenantId } from '@common/decorators';
import { Permission } from '@common/permissions/permissions.enum';
import { User, UserRole } from '@modules/users/user.entity';

@ApiTags('الإحصائيات')
@ApiBearerAuth()
@Throttle({ relaxed: {} })
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  /** إحصائيات لوحة التحكم الرئيسية */
  @Get('dashboard')
  @AllStaff()
  @RequirePermissions(Permission.DASHBOARD_STATS)
  @ApiOperation({ summary: 'إحصائيات لوحة التحكم' })
  async getDashboard(@TenantId() tenantId: string, @CurrentUser() user: User) {
    const stats = await this.service.getDashboardStats(tenantId);

    // إضافة إحصائيات خاصة بالأخصائي
    if (user.role === UserRole.SPECIALIST) {
      const myStats = await this.service.getSpecialistStats(user.id, tenantId);
      return { data: { ...stats, specialist: myStats } };
    }

    return { data: stats };
  }

  /** مخطط المواعيد — 6 أشهر */
  @Get('appointments-trend')
  @AllStaff()
  @RequirePermissions(Permission.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'مخطط المواعيد الشهري' })
  async getAppointmentsTrend(@TenantId() tenantId: string) {
    return { data: await this.service.getAppointmentsTrend(tenantId) };
  }

  /** توزيع المستفيدين حسب النوع */
  @Get('beneficiaries-by-type')
  @AllStaff()
  @RequirePermissions(Permission.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'توزيع المستفيدين حسب النوع' })
  async getBeneficiariesByType(@TenantId() tenantId: string) {
    return { data: await this.service.getBeneficiariesByType(tenantId) };
  }

  /** مخطط الإيرادات — 6 أشهر */
  @Get('revenue-trend')
  @AllStaff()
  @RequirePermissions(Permission.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'مخطط الإيرادات الشهري' })
  async getRevenueTrend(@TenantId() tenantId: string) {
    return { data: await this.service.getRevenueTrend(tenantId) };
  }
}
