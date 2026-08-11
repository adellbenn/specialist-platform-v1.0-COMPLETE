import { ServicePackage } from '../service-package.entity';

describe('ServicePackage Entity', () => {
  describe('ServicePackage class', () => {
    it('should be instantiable', () => {
      const pkg = new ServicePackage();
      expect(pkg).toBeInstanceOf(ServicePackage);
    });

    it('should allow setting all properties', () => {
      const pkg = new ServicePackage();
      pkg.tenantId = 'tenant-1';
      pkg.name = '10 Sessions Package';
      pkg.description = 'Package of 10 therapy sessions';
      pkg.sessionsCount = 10;
      pkg.price = 500;
      pkg.validityDays = 90;
      pkg.isActive = true;

      expect(pkg.tenantId).toBe('tenant-1');
      expect(pkg.name).toBe('10 Sessions Package');
      expect(pkg.description).toBe('Package of 10 therapy sessions');
      expect(pkg.sessionsCount).toBe(10);
      expect(pkg.price).toBe(500);
      expect(pkg.validityDays).toBe(90);
      expect(pkg.isActive).toBe(true);
    });

    it('should allow nullable fields to be undefined', () => {
      const pkg = new ServicePackage();
      expect(pkg.description).toBeUndefined();
    });

    it('should extend AbstractEntity and be a constructor', () => {
      expect(typeof ServicePackage).toBe('function');
    });
  });
});
