import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { AllRoles, CurrentUser } from '@common/decorators';
import { User } from '@modules/users/user.entity';

@ApiTags('الإشعارات')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  /** قائمة إشعارات المستخدم الحالي */
  @Get()
  @AllRoles()
  @ApiOperation({ summary: 'قائمة الإشعارات' })
  async findAll(
    @CurrentUser() user: User,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.service.findForUser(user.id, parseInt(page) || 1, parseInt(limit) || 20);
  }

  /** عدد الإشعارات غير المقروءة */
  @Get('unread-count')
  @AllRoles()
  @ApiOperation({ summary: 'عدد الإشعارات غير المقروءة' })
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.service.getUnreadCount(user.id);
    return { data: { count } };
  }

  /** تعليم إشعار كمقروء */
  @Patch(':id/read')
  @AllRoles()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تعليم إشعار كمقروء' })
  async markRead(@Param('id') id: string, @CurrentUser() user: User) {
    await this.service.markRead(id, user.id);
    return { message: 'تم تعليم الإشعار كمقروء' };
  }

  /** تعليم جميع الإشعارات كمقروءة */
  @Patch('read-all')
  @AllRoles()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تعليم جميع الإشعارات كمقروءة' })
  async markAllRead(@CurrentUser() user: User) {
    await this.service.markAllRead(user.id);
    return { message: 'تم تعليم جميع الإشعارات كمقروءة' };
  }
}
