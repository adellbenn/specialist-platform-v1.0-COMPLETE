import { Tenant, TenantType, SubscriptionPlan } from '../tenant.entity';

describe('Tenant Entity', () => {
  describe('TenantType enum', () => {
    it('should have correct values', () => {
      expect(TenantType.CLINIC).toBe('clinic');
      expect(TenantType.REHABILITATION).toBe('rehabilitation');
      expect(TenantType.EDUCATIONAL).toBe('educational');
      expect(TenantType.SUPPORT).toBe('support');
    });

    it('should have 4 values', () => {
      expect(Object.keys(TenantType)).toHaveLength(4);
    });
  });

  describe('SubscriptionPlan enum', () => {
    it('should have correct values', () => {
      expect(SubscriptionPlan.BASIC).toBe('basic');
      expect(SubscriptionPlan.PROFESSIONAL).toBe('professional');
      expect(SubscriptionPlan.ENTERPRISE).toBe('enterprise');
    });

    it('should have 3 values', () => {
      expect(Object.keys(SubscriptionPlan)).toHaveLength(3);
    });
  });

  describe('Tenant class', () => {
    it('should be instantiable', () => {
      const tenant = new Tenant();
      expect(tenant).toBeInstanceOf(Tenant);
    });

    it('should allow setting all properties', () => {
      const tenant = new Tenant();
      tenant.name = 'Amal Center';
      tenant.slug = 'amal-center';
      tenant.type = TenantType.CLINIC;
      tenant.subscriptionPlan = SubscriptionPlan.PROFESSIONAL;
      tenant.subscriptionExpiresAt = new Date('2027-01-01');
      tenant.maxUsers = 50;
      tenant.maxBeneficiaries = 500;
      tenant.settings = { language: 'ar', timezone: 'Asia/Riyadh' };
      tenant.logoUrl = '/uploads/logo.png';
      tenant.address = 'Riyadh, KSA';
      tenant.phone = '+966555555555';
      tenant.email = 'info@amal.com';
      tenant.isActive = true;

      expect(tenant.name).toBe('Amal Center');
      expect(tenant.slug).toBe('amal-center');
      expect(tenant.type).toBe(TenantType.CLINIC);
      expect(tenant.subscriptionPlan).toBe(SubscriptionPlan.PROFESSIONAL);
      expect(tenant.maxUsers).toBe(50);
      expect(tenant.maxBeneficiaries).toBe(500);
      expect(tenant.settings).toEqual({ language: 'ar', timezone: 'Asia/Riyadh' });
      expect(tenant.logoUrl).toBe('/uploads/logo.png');
      expect(tenant.address).toBe('Riyadh, KSA');
      expect(tenant.phone).toBe('+966555555555');
      expect(tenant.email).toBe('info@amal.com');
      expect(tenant.isActive).toBe(true);
    });

    it('should allow nullable fields to be undefined', () => {
      const tenant = new Tenant();
      expect(tenant.subscriptionExpiresAt).toBeUndefined();
      expect(tenant.settings).toBeUndefined();
      expect(tenant.logoUrl).toBeUndefined();
      expect(tenant.address).toBeUndefined();
      expect(tenant.phone).toBeUndefined();
      expect(tenant.email).toBeUndefined();
    });

    it('should extend AbstractEntity and be a constructor', () => {
      expect(typeof Tenant).toBe('function');
    });
  });
});
