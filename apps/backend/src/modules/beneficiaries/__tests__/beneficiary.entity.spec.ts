import {
  Beneficiary,
  Gender,
  CaseType,
  BeneficiaryStatus,
  ReferralSource,
} from '../beneficiary.entity';

describe('Beneficiary Entity', () => {
  describe('Gender enum', () => {
    it('should have correct values', () => {
      expect(Gender.MALE).toBe('male');
      expect(Gender.FEMALE).toBe('female');
    });

    it('should have 2 values', () => {
      expect(Object.keys(Gender)).toHaveLength(2);
    });
  });

  describe('CaseType enum', () => {
    it('should have correct values', () => {
      expect(CaseType.PSYCHOLOGICAL).toBe('psychological');
      expect(CaseType.EDUCATIONAL).toBe('educational');
      expect(CaseType.SPEECH).toBe('speech');
      expect(CaseType.OCCUPATIONAL).toBe('occupational');
      expect(CaseType.SOCIAL).toBe('social');
    });

    it('should have 5 values', () => {
      expect(Object.keys(CaseType)).toHaveLength(5);
    });
  });

  describe('BeneficiaryStatus enum', () => {
    it('should have correct values', () => {
      expect(BeneficiaryStatus.ACTIVE).toBe('active');
      expect(BeneficiaryStatus.INACTIVE).toBe('inactive');
      expect(BeneficiaryStatus.COMPLETED).toBe('completed');
      expect(BeneficiaryStatus.ARCHIVED).toBe('archived');
    });

    it('should have 4 values', () => {
      expect(Object.keys(BeneficiaryStatus)).toHaveLength(4);
    });
  });

  describe('ReferralSource enum', () => {
    it('should have correct values', () => {
      expect(ReferralSource.SELF).toBe('self');
      expect(ReferralSource.HOSPITAL).toBe('hospital');
      expect(ReferralSource.SCHOOL).toBe('school');
      expect(ReferralSource.OTHER).toBe('other');
    });

    it('should have 4 values', () => {
      expect(Object.keys(ReferralSource)).toHaveLength(4);
    });
  });

  describe('Beneficiary class', () => {
    it('should be instantiable', () => {
      const beneficiary = new Beneficiary();
      expect(beneficiary).toBeInstanceOf(Beneficiary);
    });

    it('should allow setting all properties', () => {
      const beneficiary = new Beneficiary();
      beneficiary.tenantId = 'tenant-1';
      beneficiary.fileNumber = 'F-001';
      beneficiary.firstName = 'Ahmed';
      beneficiary.lastName = 'Ali';
      beneficiary.dateOfBirth = new Date('2010-05-15');
      beneficiary.gender = Gender.MALE;
      beneficiary.nationalId = '1234567890';
      beneficiary.phone = '0555555555';
      beneficiary.email = 'test@example.com';
      beneficiary.address = 'Riyadh';
      beneficiary.guardianName = 'Ali Father';
      beneficiary.guardianPhone = '0555555556';
      beneficiary.guardianRelationship = 'Father';
      beneficiary.referralSource = ReferralSource.HOSPITAL;
      beneficiary.caseType = CaseType.PSYCHOLOGICAL;
      beneficiary.status = BeneficiaryStatus.ACTIVE;
      beneficiary.assignedSpecialistId = 'spec-1';
      beneficiary.intakeDate = new Date('2026-01-01');
      beneficiary.notes = 'Test notes';
      beneficiary.createdById = 'user-1';

      expect(beneficiary.tenantId).toBe('tenant-1');
      expect(beneficiary.fileNumber).toBe('F-001');
      expect(beneficiary.firstName).toBe('Ahmed');
      expect(beneficiary.lastName).toBe('Ali');
      expect(beneficiary.gender).toBe(Gender.MALE);
      expect(beneficiary.caseType).toBe(CaseType.PSYCHOLOGICAL);
      expect(beneficiary.status).toBe(BeneficiaryStatus.ACTIVE);
    });

    describe('fullName getter', () => {
      it('should return first and last name combined', () => {
        const beneficiary = new Beneficiary();
        beneficiary.firstName = 'Ahmed';
        beneficiary.lastName = 'Ali';
        expect(beneficiary.fullName).toBe('Ahmed Ali');
      });

      it('should handle empty names', () => {
        const beneficiary = new Beneficiary();
        beneficiary.firstName = '';
        beneficiary.lastName = '';
        expect(beneficiary.fullName).toBe(' ');
      });
    });

    it('should allow nullable fields to be undefined', () => {
      const beneficiary = new Beneficiary();
      expect(beneficiary.dateOfBirth).toBeUndefined();
      expect(beneficiary.gender).toBeUndefined();
      expect(beneficiary.nationalId).toBeUndefined();
      expect(beneficiary.phone).toBeUndefined();
      expect(beneficiary.email).toBeUndefined();
      expect(beneficiary.assignedSpecialistId).toBeUndefined();
      expect(beneficiary.notes).toBeUndefined();
    });

    it('should extend AbstractEntity and be a constructor', () => {
      expect(typeof Beneficiary).toBe('function');
    });
  });
});
