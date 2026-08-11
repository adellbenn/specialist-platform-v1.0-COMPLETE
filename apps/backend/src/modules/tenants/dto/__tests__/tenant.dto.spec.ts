import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantQueryDto,
} from '../tenant.dto';
import { TenantType, SubscriptionPlan } from '../../tenant.entity';

describe('Tenant DTOs', () => {
  describe('CreateTenantDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(CreateTenantDto, {
        name: 'Amal Center',
        slug: 'amal-center',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without name', async () => {
      const dto = plainToInstance(CreateTenantDto, {
        slug: 'amal-center',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without slug', async () => {
      const dto = plainToInstance(CreateTenantDto, {
        name: 'Amal Center',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept all optional fields', async () => {
      const dto = plainToInstance(CreateTenantDto, {
        name: 'Amal Center',
        slug: 'amal-center',
        type: TenantType.CLINIC,
        subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
        maxUsers: 50,
        maxBeneficiaries: 500,
        address: 'Riyadh',
        phone: '+966555555555',
        email: 'info@amal.com',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with invalid email', async () => {
      const dto = plainToInstance(CreateTenantDto, {
        name: 'Amal Center',
        slug: 'amal-center',
        email: 'not-an-email',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with invalid type enum', async () => {
      const dto = plainToInstance(CreateTenantDto, {
        name: 'Amal Center',
        slug: 'amal-center',
        type: 'invalid' as any,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateTenantDto', () => {
    it('should pass with partial data', async () => {
      const dto = plainToInstance(UpdateTenantDto, { name: 'Updated' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('TenantQueryDto', () => {
    it('should pass with no data', async () => {
      const dto = plainToInstance(TenantQueryDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept valid query params', async () => {
      const dto = plainToInstance(TenantQueryDto, {
        search: 'amal',
        isActive: true,
        page: 1,
        limit: 10,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
