import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreatePackageDto,
  CreateSubscriptionDto,
  CreateInvoiceDto,
  MarkPaidDto,
} from '../payments.dto';
import { PaymentMethod, PaymentStatus } from '../../invoice.entity';

describe('Payments DTOs', () => {
  describe('CreatePackageDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(CreatePackageDto, {
        name: '10 Sessions',
        sessionsCount: 10,
        price: 500,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without name', async () => {
      const dto = plainToInstance(CreatePackageDto, {
        sessionsCount: 10,
        price: 500,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without sessionsCount', async () => {
      const dto = plainToInstance(CreatePackageDto, {
        name: '10 Sessions',
        price: 500,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without price', async () => {
      const dto = plainToInstance(CreatePackageDto, {
        name: '10 Sessions',
        sessionsCount: 10,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with sessionsCount < 1', async () => {
      const dto = plainToInstance(CreatePackageDto, {
        name: '10 Sessions',
        sessionsCount: 0,
        price: 500,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with price < 0', async () => {
      const dto = plainToInstance(CreatePackageDto, {
        name: '10 Sessions',
        sessionsCount: 10,
        price: -1,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept optional fields', async () => {
      const dto = plainToInstance(CreatePackageDto, {
        name: '10 Sessions',
        sessionsCount: 10,
        price: 500,
        description: 'Best package',
        validityDays: 90,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('CreateSubscriptionDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(CreateSubscriptionDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        sessionsCount: 10,
        amountPaid: 500,
        startDate: '2026-01-01',
        expiryDate: '2026-04-01',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without beneficiaryId', async () => {
      const dto = plainToInstance(CreateSubscriptionDto, {
        sessionsCount: 10,
        amountPaid: 500,
        startDate: '2026-01-01',
        expiryDate: '2026-04-01',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with sessionsCount < 1', async () => {
      const dto = plainToInstance(CreateSubscriptionDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        sessionsCount: 0,
        amountPaid: 500,
        startDate: '2026-01-01',
        expiryDate: '2026-04-01',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CreateInvoiceDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(CreateInvoiceDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        amount: 500,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without beneficiaryId', async () => {
      const dto = plainToInstance(CreateInvoiceDto, {
        amount: 500,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with amount < 0', async () => {
      const dto = plainToInstance(CreateInvoiceDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        amount: -1,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept optional fields', async () => {
      const dto = plainToInstance(CreateInvoiceDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        amount: 500,
        subscriptionId: '550e8400-e29b-41d4-a716-446655440001',
        discount: 50,
        tax: 22.5,
        paymentMethod: PaymentMethod.CARD,
        paymentStatus: PaymentStatus.PAID,
        notes: 'Paid',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('MarkPaidDto', () => {
    it('should pass with valid paymentMethod', async () => {
      const dto = plainToInstance(MarkPaidDto, {
        paymentMethod: PaymentMethod.CASH,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without paymentMethod', async () => {
      const dto = plainToInstance(MarkPaidDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept optional notes', async () => {
      const dto = plainToInstance(MarkPaidDto, {
        paymentMethod: PaymentMethod.TRANSFER,
        notes: 'Bank transfer',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
