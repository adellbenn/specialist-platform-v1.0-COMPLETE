import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';

interface CreateNotificationDto {
  userId: string;
  tenantId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notifRepo: Repository<Notification>,
  ) {}

  /** إنشاء إشعار واحد */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notif = this.notifRepo.create(dto);
    return this.notifRepo.save(notif);
  }

  /** إنشاء إشعارات لمجموعة مستخدمين */
  async broadcast(userIds: string[], dto: Omit<CreateNotificationDto, 'userId'>): Promise<void> {
    const notifications = userIds.map((userId) => this.notifRepo.create({ ...dto, userId }));
    await this.notifRepo.save(notifications);
  }

  /**
   * إنشاء إشعار واحد دون التأثير على العملية الأساسية عند الفشل.
   * يُستخدم من الوحدات الأخرى بعد نجاح العمليات الحسّاسة.
   */
  async createSafe(dto: CreateNotificationDto): Promise<void> {
    if (!dto.userId) return;
    try {
      await this.create(dto);
    } catch (error) {
      this.logger.warn(
        `تعذّر إنشاء الإشعار للمستخدم ${dto.userId}: ${(error as Error)?.message ?? error}`,
      );
    }
  }

  /**
   * إنشاء إشعارات لمجموعة مستخدمين دون التأثير على العملية الأساسية عند الفشل.
   * يتجاهل المعرّفات الفارغة والملغية.
   */
  async broadcastSafe(
    userIds: string[],
    dto: Omit<CreateNotificationDto, 'userId'>,
  ): Promise<void> {
    const unique = [...new Set((userIds ?? []).filter((id) => !!id))];
    if (unique.length === 0) return;
    try {
      await this.broadcast(unique, dto);
    } catch (error) {
      this.logger.warn(
        `تعذّر إنشاء الإشعارات للمستخدمين ${unique.join(', ')}: ${(error as Error)?.message ?? error}`,
      );
    }
  }

  /** جلب إشعارات المستخدم */
  async findForUser(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.notifRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const unreadCount = await this.notifRepo.count({
      where: { userId, isRead: false },
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), unreadCount },
    };
  }

  /** عدد الإشعارات غير المقروءة */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notifRepo.count({ where: { userId, isRead: false } });
  }

  /** تعليم إشعار كمقروء */
  async markRead(id: string, userId: string): Promise<void> {
    await this.notifRepo.update({ id, userId }, { isRead: true, readAt: new Date() });
  }

  /** تعليم جميع إشعارات المستخدم كمقروءة */
  async markAllRead(userId: string): Promise<void> {
    await this.notifRepo.update({ userId, isRead: false }, { isRead: true, readAt: new Date() });
  }

  /** حذف إشعارات قديمة (30 يوم) */
  async cleanup(): Promise<void> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 30);

    await this.notifRepo
      .createQueryBuilder()
      .delete()
      .where('created_at < :threshold', { threshold })
      .andWhere('is_read = true')
      .execute();
  }
}
