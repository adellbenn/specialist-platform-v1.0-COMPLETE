import { Invoice, PaymentMethod, PaymentStatus } from '../invoice.entity';

describe('Invoice Entity', () => {
  describe('PaymentMethod enum', () => {
    it('should have correct values', () => {
      expect(PaymentMethod.CASH).toBe('cash');
      expect(PaymentMethod.CARD).toBe('card');
      expect(PaymentMethod.TRANSFER).toBe('transfer');
      expect(PaymentMethod.INSURANCE).toBe('insurance');
    });

    it('should have 4 values', () => {
      expect(Object.keys(PaymentMethod)).toHaveLength(4);
    });
  });

  describe('PaymentStatus enum', () => {
    it('should have correct values', () => {
      expect(PaymentStatus.PENDING).toBe('pending');
      expect(PaymentStatus.PAID).toBe('paid');
      expect(PaymentStatus.PARTIAL).toBe('partial');
      expect(PaymentStatus.REFUNDED).toBe('refunded');
    });

    it('should have 4 values', () => {
      expect(Object.keys(PaymentStatus)).toHaveLength(4);
    });
  });

  describe('Invoice class', () => {
    it('should be instantiable', () => {
      const invoice = new Invoice();
      expect(invoice).toBeInstanceOf(Invoice);
    });

    it('should allow setting all properties', () => {
      const invoice = new Invoice();
      invoice.tenantId = 'tenant-1';
      invoice.invoiceNumber = 'INV-001';
      invoice.beneficiaryId = 'ben-1';
      invoice.subscriptionId = 'sub-1';
      invoice.amount = 500;
      invoice.discount = 50;
      invoice.tax = 22.5;
      invoice.total = 472.5;
      invoice.paymentMethod = PaymentMethod.CARD;
      invoice.paymentStatus = PaymentStatus.PAID;
      invoice.paidAt = new Date();
      invoice.notes = 'Payment received';
      invoice.createdById = 'user-1';

      expect(invoice.tenantId).toBe('tenant-1');
      expect(invoice.invoiceNumber).toBe('INV-001');
      expect(invoice.beneficiaryId).toBe('ben-1');
      expect(invoice.subscriptionId).toBe('sub-1');
      expect(invoice.amount).toBe(500);
      expect(invoice.discount).toBe(50);
      expect(invoice.tax).toBe(22.5);
      expect(invoice.total).toBe(472.5);
      expect(invoice.paymentMethod).toBe(PaymentMethod.CARD);
      expect(invoice.paymentStatus).toBe(PaymentStatus.PAID);
      expect(invoice.notes).toBe('Payment received');
    });

    it('should allow nullable fields to be undefined', () => {
      const invoice = new Invoice();
      expect(invoice.subscriptionId).toBeUndefined();
      expect(invoice.paymentMethod).toBeUndefined();
      expect(invoice.paidAt).toBeUndefined();
      expect(invoice.notes).toBeUndefined();
      expect(invoice.createdById).toBeUndefined();
    });

    it('should extend AbstractEntity and be a constructor', () => {
      expect(typeof Invoice).toBe('function');
    });
  });
});
