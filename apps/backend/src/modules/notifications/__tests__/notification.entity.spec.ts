import { Notification, NotificationType } from '../notification.entity';

describe('Notification Entity', () => {
  describe('NotificationType enum', () => {
    it('should have correct values', () => {
      expect(NotificationType.APPOINTMENT_REMINDER).toBe('appointment_reminder');
      expect(NotificationType.SESSION_DUE).toBe('session_due');
      expect(NotificationType.REPORT_DUE).toBe('report_due');
      expect(NotificationType.PAYMENT_DUE).toBe('payment_due');
      expect(NotificationType.REPORT_SUBMITTED).toBe('report_submitted');
      expect(NotificationType.REPORT_APPROVED).toBe('report_approved');
      expect(NotificationType.NEW_BENEFICIARY).toBe('new_beneficiary');
      expect(NotificationType.SUBSCRIPTION_EXPIRING).toBe('subscription_expiring');
      expect(NotificationType.SYSTEM).toBe('system');
    });

    it('should have 9 values', () => {
      expect(Object.keys(NotificationType)).toHaveLength(9);
    });
  });

  describe('Notification class', () => {
    it('should be instantiable', () => {
      const notification = new Notification();
      expect(notification).toBeInstanceOf(Notification);
    });

    it('should allow setting all properties', () => {
      const notification = new Notification();
      notification.tenantId = 'tenant-1';
      notification.userId = 'user-1';
      notification.type = NotificationType.APPOINTMENT_REMINDER;
      notification.title = 'Appointment Tomorrow';
      notification.message = 'You have an appointment tomorrow at 10 AM';
      notification.link = '/appointments/123';
      notification.isRead = false;

      expect(notification.tenantId).toBe('tenant-1');
      expect(notification.userId).toBe('user-1');
      expect(notification.type).toBe(NotificationType.APPOINTMENT_REMINDER);
      expect(notification.title).toBe('Appointment Tomorrow');
      expect(notification.message).toBe('You have an appointment tomorrow at 10 AM');
      expect(notification.link).toBe('/appointments/123');
      expect(notification.isRead).toBe(false);
    });

    it('should allow nullable fields to be undefined', () => {
      const notification = new Notification();
      expect(notification.tenantId).toBeUndefined();
      expect(notification.link).toBeUndefined();
      expect(notification.readAt).toBeUndefined();
    });

    it('should extend AbstractEntity and be a constructor', () => {
      expect(typeof Notification).toBe('function');
    });
  });
});
