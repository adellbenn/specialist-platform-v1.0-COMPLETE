import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, TenantQueryDto } from './dto/tenant.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { RbacGuard } from '@common/guards/rbac.guard';
import {
  Roles,
  RequirePermissions,
  AllRoles,
  AllStaff,
  WriterOnly,
  CurrentUser,
} from '@common/decorators';
import { Permission } from '@common/permissions/permissions.enum';
import { User } from '@modules/users/user.entity';
import { UserRole } from '@modules/users/user.entity';

@ApiTags('المراكز')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * إنشاء مركز — Super Admin فقط (يتجاوز قاعدة RBAC العامة)
   * ملاحظة: super_admin هو ADMIN_CLASS لكنه يملك صلاحية خاصة لإنشاء المراكز
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'إنشاء مركز جديد — Super Admin فقط' })
  async create(@Body() dto: CreateTenantDto) {
    const tenant = await this.tenantsService.create(dto);
    return { data: tenant, message: 'تم إنشاء المركز بنجاح' };
  }

  /**
   * قائمة المراكز — جميع الأدوار (إدارة فقط)
   */
  @Get()
  @RequirePermissions(Permission.TENANT_VIEW)
  @ApiOperation({ summary: 'قائمة جميع المراكز — إدارة فقط' })
  async findAll(@Query() query: TenantQueryDto) {
    return this.tenantsService.findAll(query);
  }

  /**
   * تفاصيل مركز — جميع الأدوار
   */
  @Get(':id')
  @AllRoles()
  @ApiOperation({ summary: 'تفاصيل مركز' })
  async findOne(@Param('id') id: string) {
    const tenant = await this.tenantsService.findOne(id);
    return { data: tenant };
  }

  /**
   * تعديل مركز — Super Admin فقط
   */
  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'تعديل مركز — Super Admin فقط' })
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    const tenant = await this.tenantsService.update(id, dto);
    return { data: tenant, message: 'تم تعديل المركز بنجاح' };
  }

  /**
   * تفعيل/تعطيل مركز — Super Admin فقط
   */
  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'تفعيل/تعطيل مركز — Super Admin فقط' })
  async toggleActive(@Param('id') id: string) {
    const tenant = await this.tenantsService.toggleActive(id);
    return {
      data: tenant,
      message: tenant.isActive ? 'تم تفعيل المركز' : 'تم تعطيل المركز',
    };
  }

  /**
   * تعديل بيانات المركز الحالي — الإدارة والكتابة
   */
  @Patch('profile')
  @AllStaff()
  @ApiOperation({ summary: 'تعديل بيانات المركز الحالي — الإدارة والكتابة' })
  async updateProfile(@Body() dto: UpdateTenantDto, @CurrentUser() user: User) {
    if (!user.tenantId) {
      throw new BadRequestException('حسابك غير مرتبط بأي مركز — لا يمكن تعديل بيانات المركز');
    }
    const tenant = await this.tenantsService.update(user.tenantId, dto);
    return { data: tenant, message: 'تم تعديل بيانات المركز بنجاح' };
  }

  /**
   * إحصائيات مركز — إدارة فقط
   */
  @Get(':id/stats')
  @RequirePermissions(Permission.TENANT_VIEW)
  @ApiOperation({ summary: 'إحصائيات المركز — إدارة فقط' })
  async getStats(@Param('id') id: string) {
    return this.tenantsService.getStats(id);
  }
}
