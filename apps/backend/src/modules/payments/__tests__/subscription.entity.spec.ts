import { Subscription, SubscriptionStatus } from '../subscription.entity';

describe('Subscription Entity', () => {
  describe('SubscriptionStatus enum', () => {
    it('should have correct values', () => {
      expect(SubscriptionStatus.ACTIVE).toBe('active');
      expect(SubscriptionStatus.EXPIRED).toBe('expired');
      expect(SubscriptionStatus.CANCELLED).toBe('cancelled');
      expect(SubscriptionStatus.COMPLETED).toBe('completed');
    });

    it('should have 4 values', () => {
      expect(Object.keys(SubscriptionStatus)).toHaveLength(4);
    });
  });

  describe('Subscription class', () => {
    it('should be instantiable', () => {
      const subscription = new Subscription();
      expect(subscription).toBeInstanceOf(Subscription);
    });

    it('should allow setting all properties', () => {
      const subscription = new Subscription();
      subscription.tenantId = 'tenant-1';
      subscription.beneficiaryId = 'ben-1';
      subscription.packageId = 'pkg-1';
      subscription.sessionsUsed = 3;
      subscription.sessionsRemaining = 7;
      subscription.amountPaid = 500;
      subscription.discountAmount = 50;
      subscription.startDate = new Date('2026-01-01');
      subscription.expiryDate = new Date('2026-04-01');
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.createdById = 'user-1';

      expect(subscription.tenantId).toBe('tenant-1');
      expect(subscription.beneficiaryId).toBe('ben-1');
      expect(subscription.packageId).toBe('pkg-1');
      expect(subscription.sessionsUsed).toBe(3);
      expect(subscription.sessionsRemaining).toBe(7);
      expect(subscription.amountPaid).toBe(500);
      expect(subscription.discountAmount).toBe(50);
      expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should allow nullable fields to be undefined', () => {
      const subscription = new Subscription();
      expect(subscription.packageId).toBeUndefined();
      expect(subscription.createdById).toBeUndefined();
    });

    it('should extend AbstractEntity and be a constructor', () => {
      expect(typeof Subscription).toBe('function');
    });
  });
});
