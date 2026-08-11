import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/user.dto';
import { UpdatePreferencesDto } from './dto/preferences.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { RbacGuard } from '@common/guards/rbac.guard';
import {
  RequirePermissions,
  WriterOnly,
  AllRoles,
  CurrentUser,
  TenantId,
} from '@common/decorators';
import { Permission } from '@common/permissions/permissions.enum';
import { UserRole, User } from './user.entity';

@ApiTags('المستخدمون')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * إنشاء مستخدم — WRITER فقط (أخصائي/استقبال)
   * المدير لا يستطيع إنشاء مستخدمين
   */
  @Post()
  @WriterOnly()
  @RequirePermissions(Permission.USER_CREATE)
  @ApiOperation({ summary: 'إنشاء مستخدم جديد — أخصائيون فقط' })
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: User,
    @TenantId() tenantId: string,
  ) {
    const created = await this.usersService.create(dto, user.role, tenantId);
    return { data: created, message: 'تم إنشاء المستخدم بنجاح' };
  }

  /**
   * قائمة المستخدمين — جميع الأدوار (مدير يقرأ فقط)
   */
  @Get()
  @AllRoles()
  @RequirePermissions(Permission.USER_VIEW)
  @ApiOperation({ summary: 'قائمة المستخدمين' })
  async findAll(@Query() query: UserQueryDto, @TenantId() tenantId: string) {
    return this.usersService.findAll(query, tenantId);
  }

  /**
   * تفاصيل مستخدم — جميع الأدوار
   */
  @Get(':id')
  @AllRoles()
  @RequirePermissions(Permission.USER_VIEW)
  @ApiOperation({ summary: 'تفاصيل مستخدم' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const user = await this.usersService.findOne(id, tenantId);
    return { data: user };
  }

  /**
   * تعديل مستخدم — WRITER فقط
   */
  @Put(':id')
  @WriterOnly()
  @RequirePermissions(Permission.USER_UPDATE)
  @ApiOperation({ summary: 'تعديل مستخدم — أخصائيون فقط' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @TenantId() tenantId: string) {
    const updated = await this.usersService.update(id, dto, tenantId);
    return { data: updated, message: 'تم تعديل المستخدم بنجاح' };
  }

  /**
   * تفعيل/تعطيل مستخدم — WRITER فقط
   */
  @Patch(':id/toggle-active')
  @WriterOnly()
  @RequirePermissions(Permission.USER_DEACTIVATE)
  @ApiOperation({ summary: 'تفعيل/تعطيل مستخدم — أخصائيون فقط' })
  async toggleActive(@Param('id') id: string, @TenantId() tenantId: string) {
    const user = await this.usersService.toggleActive(id, tenantId);
    return {
      data: user,
      message: user.isActive ? 'تم تفعيل المستخدم' : 'تم تعطيل المستخدم',
    };
  }

  /**
   * حذف مستخدم — WRITER فقط
   */
  @Delete(':id')
  @WriterOnly()
  @RequirePermissions(Permission.USER_DELETE)
  @ApiOperation({ summary: 'حذف مستخدم — أخصائيون فقط' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.usersService.remove(id, tenantId);
    return { message: 'تم حذف المستخدم بنجاح' };
  }

  // ─── التفضيلات (Preferences) ─────────────────────────────────

  @Get('preferences/me')
  @AllRoles()
  @ApiOperation({ summary: 'الحصول على تفضيلات المستخدم' })
  async getMyPreferences(@CurrentUser() user: User) {
    const prefs = await this.usersService.getPreferences(user.id);
    return { data: prefs };
  }

  @Put('preferences/me')
  @AllRoles()
  @ApiOperation({ summary: 'تحديث تفضيلات المستخدم' })
  async updateMyPreferences(@CurrentUser() user: User, @Body() dto: UpdatePreferencesDto) {
    const updated = await this.usersService.updatePreferences(user.id, dto.preferences || {});
    return { data: updated, message: 'تم تحديث التفضيلات' };
  }
}
