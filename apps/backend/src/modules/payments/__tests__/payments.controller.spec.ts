import { PaymentsController } from '../payments.controller';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: any;

  beforeEach(() => {
    service = {
      getStats: jest.fn(),
      createPackage: jest.fn(),
      findPackages: jest.fn(),
      findAllPackages: jest.fn(),
      updatePackage: jest.fn(),
      createSubscription: jest.fn(),
      findSubscriptions: jest.fn(),
      findSubscription: jest.fn(),
      getActiveBeneficiarySubscription: jest.fn(),
      cancelSubscription: jest.fn(),
      createInvoice: jest.fn(),
      findInvoices: jest.fn(),
      findInvoice: jest.fn(),
      markAsPaid: jest.fn(),
      refund: jest.fn(),
    };
    controller = new PaymentsController(service);
  });

  const mockUser = { id: 'user-1', role: 'specialist', tenantId: 'tenant-1' } as any;

  describe('getStats', () => {
    it('should call service.getStats', async () => {
      const stats = { totalRevenue: 5000 };
      service.getStats.mockResolvedValue(stats);

      const response = await controller.getStats('tenant-1');

      expect(service.getStats).toHaveBeenCalledWith('tenant-1');
      expect(response).toEqual({ data: stats });
    });
  });

  describe('createPackage', () => {
    it('should call service.createPackage', async () => {
      const dto = { name: '10 Sessions', sessionsCount: 10, price: 500 };
      const result = { id: 'pkg-1', name: '10 Sessions' };
      service.createPackage.mockResolvedValue(result);

      const response = await controller.createPackage(dto as any, 'tenant-1');

      expect(service.createPackage).toHaveBeenCalledWith(dto, 'tenant-1');
      expect(response).toEqual({ data: result, message: 'تم إنشاء الباقة بنجاح' });
    });
  });

  describe('getPackages', () => {
    it('should call service.findPackages', async () => {
      const result = [{ id: 'pkg-1' }];
      service.findPackages.mockResolvedValue(result);

      const response = await controller.getPackages('tenant-1');

      expect(service.findPackages).toHaveBeenCalledWith('tenant-1');
      expect(response).toEqual({ data: result });
    });
  });

  describe('getAllPackages', () => {
    it('should call service.findAllPackages', async () => {
      const result = [{ id: 'pkg-1' }];
      service.findAllPackages.mockResolvedValue(result);

      const response = await controller.getAllPackages('tenant-1');

      expect(service.findAllPackages).toHaveBeenCalledWith('tenant-1');
      expect(response).toEqual({ data: result });
    });
  });

  describe('updatePackage', () => {
    it('should call service.updatePackage', async () => {
      const dto = { price: 600 };
      const result = { id: 'pkg-1', price: 600 };
      service.updatePackage.mockResolvedValue(result);

      const response = await controller.updatePackage('pkg-1', dto as any, 'tenant-1');

      expect(service.updatePackage).toHaveBeenCalledWith('pkg-1', dto, 'tenant-1');
      expect(response).toEqual({ data: result, message: 'تم تعديل الباقة بنجاح' });
    });
  });

  describe('createSubscription', () => {
    it('should call service.createSubscription', async () => {
      const dto = { beneficiaryId: 'ben-1', sessionsCount: 10, amountPaid: 500, startDate: '2026-01-01', expiryDate: '2026-04-01' };
      const result = { id: 'sub-1' };
      service.createSubscription.mockResolvedValue(result);

      const response = await controller.createSubscription(dto as any, 'tenant-1', mockUser);

      expect(service.createSubscription).toHaveBeenCalledWith(dto, 'tenant-1', 'user-1');
      expect(response).toEqual({ data: result, message: 'تم إنشاء الاشتراك وإصدار الفاتورة بنجاح' });
    });
  });

  describe('getSubscriptions', () => {
    it('should call service.findSubscriptions', async () => {
      const result = { data: [], total: 0 };
      service.findSubscriptions.mockResolvedValue(result);

      const response = await controller.getSubscriptions({} as any, 'tenant-1');

      expect(service.findSubscriptions).toHaveBeenCalledWith({}, 'tenant-1');
      expect(response).toBe(result);
    });
  });

  describe('getSubscription', () => {
    it('should call service.findSubscription', async () => {
      const result = { id: 'sub-1' };
      service.findSubscription.mockResolvedValue(result);

      const response = await controller.getSubscription('sub-1', 'tenant-1');

      expect(service.findSubscription).toHaveBeenCalledWith('sub-1', 'tenant-1');
      expect(response).toEqual({ data: result });
    });
  });

  describe('getActiveSubscription', () => {
    it('should call service.getActiveBeneficiarySubscription', async () => {
      const result = { id: 'sub-1', status: 'active' };
      service.getActiveBeneficiarySubscription.mockResolvedValue(result);

      const response = await controller.getActiveSubscription('ben-1', 'tenant-1');

      expect(service.getActiveBeneficiarySubscription).toHaveBeenCalledWith('ben-1', 'tenant-1');
      expect(response).toEqual({ data: result });
    });
  });

  describe('cancelSubscription', () => {
    it('should call service.cancelSubscription', async () => {
      const result = { id: 'sub-1', status: 'cancelled' };
      service.cancelSubscription.mockResolvedValue(result);

      const response = await controller.cancelSubscription('sub-1', 'tenant-1');

      expect(service.cancelSubscription).toHaveBeenCalledWith('sub-1', 'tenant-1');
      expect(response).toEqual({ data: result, message: 'تم إلغاء الاشتراك' });
    });
  });

  describe('createInvoice', () => {
    it('should call service.createInvoice', async () => {
      const dto = { beneficiaryId: 'ben-1', amount: 500 };
      const result = { id: 'inv-1' };
      service.createInvoice.mockResolvedValue(result);

      const response = await controller.createInvoice(dto as any, 'tenant-1', mockUser);

      expect(service.createInvoice).toHaveBeenCalledWith(dto, 'tenant-1', 'user-1');
      expect(response).toEqual({ data: result, message: 'تم إصدار الفاتورة بنجاح' });
    });
  });

  describe('getInvoices', () => {
    it('should call service.findInvoices', async () => {
      const result = { data: [], total: 0 };
      service.findInvoices.mockResolvedValue(result);

      const response = await controller.getInvoices({} as any, 'tenant-1');

      expect(service.findInvoices).toHaveBeenCalledWith({}, 'tenant-1');
      expect(response).toBe(result);
    });
  });

  describe('getInvoice', () => {
    it('should call service.findInvoice', async () => {
      const result = { id: 'inv-1' };
      service.findInvoice.mockResolvedValue(result);

      const response = await controller.getInvoice('inv-1', 'tenant-1');

      expect(service.findInvoice).toHaveBeenCalledWith('inv-1', 'tenant-1');
      expect(response).toEqual({ data: result });
    });
  });

  describe('markPaid', () => {
    it('should call service.markAsPaid', async () => {
      const dto = { paymentMethod: 'cash', notes: 'Paid in cash' };
      const result = { id: 'inv-1', paymentStatus: 'paid' };
      service.markAsPaid.mockResolvedValue(result);

      const response = await controller.markPaid('inv-1', dto as any, 'tenant-1');

      expect(service.markAsPaid).toHaveBeenCalledWith('inv-1', dto, 'tenant-1');
      expect(response).toEqual({ data: result, message: 'تم تسجيل الدفع بنجاح' });
    });
  });

  describe('refund', () => {
    it('should call service.refund', async () => {
      const result = { id: 'inv-1', paymentStatus: 'refunded' };
      service.refund.mockResolvedValue(result);

      const response = await controller.refund('inv-1', 'tenant-1');

      expect(service.refund).toHaveBeenCalledWith('inv-1', 'tenant-1');
      expect(response).toEqual({ data: result, message: 'تم استرداد المبلغ' });
    });
  });
});
