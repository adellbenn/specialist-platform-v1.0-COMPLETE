import { NotificationsController } from '../notifications.controller';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: any;

  beforeEach(() => {
    service = {
      findForUser: jest.fn(),
      getUnreadCount: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
    };
    controller = new NotificationsController(service);
  });

  const mockUser = { id: 'user-1', role: 'specialist' } as any;

  describe('findAll', () => {
    it('should call service.findForUser with parsed page/limit', async () => {
      const result = { data: [], total: 0 };
      service.findForUser.mockResolvedValue(result);

      const response = await controller.findAll(mockUser, '2', '10');

      expect(service.findForUser).toHaveBeenCalledWith('user-1', 2, 10);
      expect(response).toBe(result);
    });

    it('should default to page 1 and limit 20 when invalid', async () => {
      service.findForUser.mockResolvedValue({ data: [] });

      await controller.findAll(mockUser, undefined as any, undefined as any);

      expect(service.findForUser).toHaveBeenCalledWith('user-1', 1, 20);
    });

    it('should default to 1 for invalid page and 20 for invalid limit', async () => {
      service.findForUser.mockResolvedValue({ data: [] });

      await controller.findAll(mockUser, 'abc', 'xyz');

      expect(service.findForUser).toHaveBeenCalledWith('user-1', 1, 20);
    });
  });

  describe('getUnreadCount', () => {
    it('should call service.getUnreadCount', async () => {
      service.getUnreadCount.mockResolvedValue(5);

      const response = await controller.getUnreadCount(mockUser);

      expect(service.getUnreadCount).toHaveBeenCalledWith('user-1');
      expect(response).toEqual({ data: { count: 5 } });
    });

    it('should return 0 when no unread', async () => {
      service.getUnreadCount.mockResolvedValue(0);

      const response = await controller.getUnreadCount(mockUser);

      expect(response).toEqual({ data: { count: 0 } });
    });
  });

  describe('markRead', () => {
    it('should call service.markRead', async () => {
      service.markRead.mockResolvedValue(undefined);

      const response = await controller.markRead('notif-1', mockUser);

      expect(service.markRead).toHaveBeenCalledWith('notif-1', 'user-1');
      expect(response).toEqual({ message: 'تم تعليم الإشعار كمقروء' });
    });
  });

  describe('markAllRead', () => {
    it('should call service.markAllRead', async () => {
      service.markAllRead.mockResolvedValue(undefined);

      const response = await controller.markAllRead(mockUser);

      expect(service.markAllRead).toHaveBeenCalledWith('user-1');
      expect(response).toEqual({ message: 'تم تعليم جميع الإشعارات كمقروءة' });
    });
  });
});
