import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications.service';
import { Notification, NotificationType } from '../notification.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notifRepo: jest.Mocked<Repository<Notification>>;

  const makeNotification = (overrides: Partial<Notification> = {}): Notification =>
    ({
      id: 'notif-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      type: NotificationType.APPOINTMENT_REMINDER,
      title: 'Upcoming Appointment',
      message: 'You have an appointment tomorrow',
      link: '/dashboard/appointments/apt-1',
      isRead: false,
      readAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Notification;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(NotificationsService);
    notifRepo = module.get(getRepositoryToken(Notification));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create a notification', async () => {
      notifRepo.create.mockReturnValue(makeNotification());
      notifRepo.save.mockResolvedValue(makeNotification());

      const result = await service.create({
        userId: 'user-1',
        type: NotificationType.APPOINTMENT_REMINDER,
        title: 'Reminder',
        message: 'Your appointment is tomorrow',
      });
      expect(result).toBeDefined();
      expect(notifRepo.save).toHaveBeenCalled();
    });
  });

  describe('broadcast', () => {
    it('should create notifications for multiple users', async () => {
      notifRepo.create
        .mockReturnValueOnce(makeNotification({ userId: 'user-1' }))
        .mockReturnValueOnce(makeNotification({ userId: 'user-2' }));
      notifRepo.save.mockResolvedValue([] as any);

      await service.broadcast(['user-1', 'user-2'], {
        type: NotificationType.SYSTEM,
        title: 'System Alert',
        message: 'System maintenance',
      });
      expect(notifRepo.create).toHaveBeenCalledTimes(2);
      expect(notifRepo.save).toHaveBeenCalled();
    });

    it('should handle empty userIds', async () => {
      notifRepo.save.mockResolvedValue([] as any);
      await service.broadcast([], {
        type: NotificationType.SYSTEM,
        title: 'Alert',
        message: 'msg',
      });
      expect(notifRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('findForUser', () => {
    it('should return paginated notifications with unread count', async () => {
      const notifs = [makeNotification(), makeNotification({ id: 'notif-2', isRead: true })];
      notifRepo.findAndCount.mockResolvedValue([notifs, 2]);
      notifRepo.count.mockResolvedValue(1);

      const result = await service.findForUser('user-1');
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.unreadCount).toBe(1);
    });

    it('should support custom page and limit', async () => {
      notifRepo.findAndCount.mockResolvedValue([[], 0]);
      notifRepo.count.mockResolvedValue(0);

      await service.findForUser('user-1', 2, 10);
      expect(notifRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      notifRepo.count.mockResolvedValue(5);
      const result = await service.getUnreadCount('user-1');
      expect(result).toBe(5);
    });
  });

  describe('markRead', () => {
    it('should mark a notification as read', async () => {
      notifRepo.update.mockResolvedValue({ affected: 1 } as any);
      await service.markRead('notif-1', 'user-1');
      expect(notifRepo.update).toHaveBeenCalledWith(
        { id: 'notif-1', userId: 'user-1' },
        { isRead: true, readAt: expect.any(Date) },
      );
    });
  });

  describe('markAllRead', () => {
    it('should mark all user notifications as read', async () => {
      notifRepo.update.mockResolvedValue({ affected: 5 } as any);
      await service.markAllRead('user-1');
      expect(notifRepo.update).toHaveBeenCalledWith(
        { userId: 'user-1', isRead: false },
        { isRead: true, readAt: expect.any(Date) },
      );
    });
  });

  describe('cleanup', () => {
    it('should delete old read notifications', async () => {
      const mockQb: any = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 10 }),
      };
      notifRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.cleanup();
      expect(mockQb.execute).toHaveBeenCalled();
    });
  });
});
