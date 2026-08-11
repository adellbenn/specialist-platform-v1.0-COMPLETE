import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, UpdateSessionDto, SessionQueryDto } from './dto/session.dto';
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

@ApiTags('الجلسات')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  @Post()
  @WriterOnly()
  @RequirePermissions(Permission.SESSION_CREATE)
  @ApiOperation({ summary: 'تسجيل جلسة جديدة' })
  async create(@Body() dto: CreateSessionDto, @TenantId() tenantId: string) {
    const result = await this.service.create(dto, tenantId);
    return { data: result, message: 'تم تسجيل الجلسة بنجاح' };
  }

  @Get()
  @StaffOrBeneficiary()
  @RequirePermissions(Permission.SESSION_VIEW_OWN)
  @ApiOperation({ summary: 'قائمة الجلسات' })
  async findAll(
    @Query() query: SessionQueryDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.findAll(query, tenantId, user);
  }

  @Get('stats')
  @AllStaff()
  @ApiOperation({ summary: 'إحصائيات الجلسات' })
  async getStats(@TenantId() tenantId: string) {
    return { data: await this.service.getStats(tenantId) };
  }

  @Get(':id')
  @StaffOrBeneficiary()
  @ApiOperation({ summary: 'تفاصيل جلسة' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string, @CurrentUser() user: User) {
    return { data: await this.service.findOne(id, tenantId, user) };
  }

  @Put(':id')
  @WriterOnly()
  @RequirePermissions(Permission.SESSION_UPDATE)
  @ApiOperation({ summary: 'تعديل جلسة' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.service.update(id, dto, tenantId, user);
    return { data: result, message: 'تم تعديل الجلسة بنجاح' };
  }
}
