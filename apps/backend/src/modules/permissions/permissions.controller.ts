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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  CreatePermissionGroupDto,
  UpdatePermissionGroupDto,
  UserPermissionOverrideDto,
  BulkPermissionDto,
} from './dto/permission.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RbacGuard } from '@common/guards/rbac.guard';
import { RequirePermissions, CurrentUser, SkipRbac } from '@common/decorators';
import { Permission } from '@common/permissions/permissions.enum';
import { User } from '@modules/users/user.entity';
import { PermissionEngine } from '@common/permissions/permission-engine.service';

@ApiTags('إدارة الصلاحيات')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(
    private readonly service: PermissionsService,
    private readonly engine: PermissionEngine,
  ) {}

  // ─── Seed ─────────────────────────────────────────────────────
  @Post('seed')
  @RequirePermissions(Permission.PERMISSION_MANAGE)
  @ApiOperation({ summary: 'بذر الصلاحيات الافتراضية' })
  async seed(@CurrentUser() user: User) {
    const count = await this.service.seedPermissions();
    await this.service.seedRolesFromMap(user.id);
    return { data: count, message: 'تم بذر الصلاحيات والأدوار الافتراضية' };
  }

  // ─── Permissions ──────────────────────────────────────────────
  @Get()
  @RequirePermissions(Permission.PERMISSION_VIEW)
  @ApiOperation({ summary: 'كل الصلاحيات' })
  async findAll() {
    return { data: await this.service.findAllPermissions() };
  }

  @Get('by-module')
  @RequirePermissions(Permission.PERMISSION_VIEW)
  @ApiOperation({ summary: 'الصلاحيات مجمعة حسب الوحدة' })
  async findByModule() {
    return { data: await this.service.findPermissionsByModule() };
  }

  // ─── Roles ────────────────────────────────────────────────────
  @Get('roles')
  @RequirePermissions(Permission.ROLE_VIEW)
  @ApiOperation({ summary: 'قائمة الأدوار' })
  async findAllRoles() {
    return { data: await this.service.findAllRoles() };
  }

  @Get('roles/stats')
  @RequirePermissions(Permission.ROLE_VIEW)
  @ApiOperation({ summary: 'إحصائيات الأدوار' })
  async getRoleStats() {
    return { data: await this.service.getRoleStats() };
  }

  @Get('roles/compare')
  @RequirePermissions(Permission.ROLE_VIEW)
  @ApiOperation({ summary: 'مقارنة الأدوار' })
  async compareRoles(@Query('ids') ids: string) {
    return { data: await this.service.compareRoles(ids.split(',')) };
  }

  @Get('roles/:id')
  @RequirePermissions(Permission.ROLE_VIEW)
  @ApiOperation({ summary: 'تفاصيل دور' })
  async findRole(@Param('id') id: string) {
    return { data: await this.service.findRole(id) };
  }

  @Post('roles')
  @RequirePermissions(Permission.ROLE_CREATE)
  @ApiOperation({ summary: 'إنشاء دور' })
  async createRole(@Body() dto: CreateRoleDto, @CurrentUser() user: User) {
    return { data: await this.service.createRole(dto, user.id), message: 'تم إنشاء الدور' };
  }

  @Put('roles/:id')
  @RequirePermissions(Permission.ROLE_UPDATE)
  @ApiOperation({ summary: 'تحديث دور' })
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto, @CurrentUser() user: User) {
    return { data: await this.service.updateRole(id, dto, user.id), message: 'تم تحديث الدور' };
  }

  @Post('roles/:id/duplicate')
  @RequirePermissions(Permission.ROLE_CREATE)
  @ApiOperation({ summary: 'نسخ دور' })
  async duplicateRole(@Param('id') id: string, @CurrentUser() user: User) {
    return { data: await this.service.duplicateRole(id, user.id), message: 'تم نسخ الدور' };
  }

  @Patch('roles/:id/archive')
  @RequirePermissions(Permission.ROLE_UPDATE)
  @ApiOperation({ summary: 'أرشفة دور' })
  async archiveRole(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.archiveRole(id, user.id);
  }

  @Delete('roles/:id')
  @RequirePermissions(Permission.ROLE_DELETE)
  @ApiOperation({ summary: 'حذف دور' })
  async deleteRole(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.deleteRole(id, user.id);
  }

  @Post('roles/seed')
  @RequirePermissions(Permission.PERMISSION_MANAGE)
  @ApiOperation({ summary: 'بذر الأدوار الافتراضية من المصفوفة الثابتة' })
  async seedRoles(@CurrentUser() user: User) {
    return { data: await this.service.seedRolesFromMap(user.id), message: 'تم بذر الأدوار' };
  }

  @Post('roles/bulk-permissions')
  @RequirePermissions(Permission.ROLE_ASSIGN_PERMISSIONS)
  @ApiOperation({ summary: 'تعيين صلاحيات جماعية' })
  async bulkAssign(@Body() dto: BulkPermissionDto, @CurrentUser() user: User) {
    return {
      data: await this.service.bulkAssignPermissions(dto, user.id),
      message: 'تم تحديث الصلاحيات',
    };
  }

  // ─── My Permissions ───────────────────────────────────────────

  @Get('users/me')
  @SkipRbac()
  @ApiOperation({ summary: 'صلاحيات المستخدم الحالي الفعلية' })
  async myPermissions(@CurrentUser() user: User) {
    if (!user.roleId) {
      const { getPermissionsForRole } = await import('@common/permissions/role-permissions');
      const perms = getPermissionsForRole(user.role as any);
      return { data: perms.map((p) => p.toString()) };
    }
    const perms = await this.engine.getEffectivePermissionsList(user.id, user.roleId, user.role);
    return { data: perms };
  }

  @Get('check')
  @SkipRbac()
  @ApiOperation({ summary: 'التحقق السريع من صلاحية' })
  @ApiQuery({ name: 'permission', required: true })
  async checkPermission(@Query('permission') permission: string, @CurrentUser() user: User) {
    const allowed = await this.engine.authorize(user, permission);
    return { data: { permission, allowed } };
  }

  // ─── Permission Groups ────────────────────────────────────────
  @Post('groups/seed')
  @RequirePermissions(Permission.GROUP_CREATE)
  @ApiOperation({ summary: 'إنشاء المجموعات الافتراضية' })
  async seedGroups(@CurrentUser() user: User) {
    return { data: await this.service.seedDefaultGroups(user.id), message: 'تم إنشاء المجموعات' };
  }

  @Get('groups')
  @RequirePermissions(Permission.GROUP_VIEW)
  @ApiOperation({ summary: 'مجموعات الصلاحيات' })
  async findAllGroups() {
    return { data: await this.service.findAllGroups() };
  }

  @Get('groups/:id')
  @RequirePermissions(Permission.GROUP_VIEW)
  @ApiOperation({ summary: 'تفاصيل مجموعة' })
  async findGroup(@Param('id') id: string) {
    return { data: await this.service.findGroup(id) };
  }

  @Post('groups')
  @RequirePermissions(Permission.GROUP_CREATE)
  @ApiOperation({ summary: 'إنشاء مجموعة صلاحيات' })
  async createGroup(@Body() dto: CreatePermissionGroupDto, @CurrentUser() user: User) {
    return { data: await this.service.createGroup(dto, user.id), message: 'تم إنشاء المجموعة' };
  }

  @Put('groups/:id')
  @RequirePermissions(Permission.GROUP_UPDATE)
  @ApiOperation({ summary: 'تحديث مجموعة' })
  async updateGroup(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionGroupDto,
    @CurrentUser() user: User,
  ) {
    return { data: await this.service.updateGroup(id, dto, user.id), message: 'تم تحديث المجموعة' };
  }

  @Delete('groups/:id')
  @RequirePermissions(Permission.GROUP_DELETE)
  @ApiOperation({ summary: 'حذف مجموعة' })
  async deleteGroup(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.deleteGroup(id, user.id);
  }

  // ─── User Overrides ───────────────────────────────────────────
  @Get('users/:userId/effective')
  @RequirePermissions(Permission.USER_OVERRIDE)
  @ApiOperation({ summary: 'الصلاحيات الفعلية لمستخدم' })
  async getUserEffective(@Param('userId') userId: string) {
    return { data: await this.service.getUserEffectivePermissions(userId) };
  }

  @Post('users/override')
  @RequirePermissions(Permission.USER_OVERRIDE)
  @ApiOperation({ summary: 'تجاوز صلاحية لمستخدم' })
  async setOverride(@Body() dto: UserPermissionOverrideDto, @CurrentUser() user: User) {
    return this.service.setUserOverride(dto, user.id);
  }

  @Delete('users/:userId/override/:permissionId')
  @RequirePermissions(Permission.USER_OVERRIDE)
  @ApiOperation({ summary: 'إزالة تجاوز صلاحية' })
  async removeOverride(
    @Param('userId') userId: string,
    @Param('permissionId') permissionId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.removeUserOverride(userId, permissionId, user.id);
  }
}
