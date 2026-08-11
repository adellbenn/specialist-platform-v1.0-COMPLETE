import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateBeneficiaryDto,
  UpdateBeneficiaryDto,
  BeneficiaryQueryDto,
  AssignSpecialistDto,
  UpdateBeneficiaryFileDto,
} from '../beneficiary.dto';
import { Gender, CaseType, BeneficiaryStatus, ReferralSource } from '../../beneficiary.entity';

describe('Beneficiary DTOs', () => {
  describe('CreateBeneficiaryDto', () => {
    it('should pass with valid required fields', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        firstName: 'Ahmed',
        lastName: 'Ali',
        caseType: CaseType.PSYCHOLOGICAL,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without firstName', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        lastName: 'Ali',
        caseType: CaseType.PSYCHOLOGICAL,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without lastName', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        firstName: 'Ahmed',
        caseType: CaseType.PSYCHOLOGICAL,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without caseType', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        firstName: 'Ahmed',
        lastName: 'Ali',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept all optional fields', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        firstName: 'Ahmed',
        lastName: 'Ali',
        caseType: CaseType.PSYCHOLOGICAL,
        dateOfBirth: '2010-05-15',
        gender: Gender.MALE,
        nationalId: '1234567890',
        phone: '0555555555',
        email: 'test@example.com',
        address: 'Riyadh',
        guardianName: 'Ali Father',
        guardianPhone: '0555555556',
        guardianRelationship: 'Father',
        referralSource: ReferralSource.HOSPITAL,
        intakeDate: '2026-01-01',
        notes: 'Test notes',
        assignedSpecialistId: '550e8400-e29b-41d4-a716-446655440000',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with invalid email', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        firstName: 'Ahmed',
        lastName: 'Ali',
        caseType: CaseType.PSYCHOLOGICAL,
        email: 'not-an-email',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with invalid gender enum', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        firstName: 'Ahmed',
        lastName: 'Ali',
        caseType: CaseType.PSYCHOLOGICAL,
        gender: 'other' as any,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateBeneficiaryDto', () => {
    it('should pass with partial data', async () => {
      const dto = plainToInstance(UpdateBeneficiaryDto, { phone: '0555555555' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept status field', async () => {
      const dto = plainToInstance(UpdateBeneficiaryDto, {
        status: BeneficiaryStatus.INACTIVE,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('BeneficiaryQueryDto', () => {
    it('should pass with no data', async () => {
      const dto = plainToInstance(BeneficiaryQueryDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept valid query params', async () => {
      const dto = plainToInstance(BeneficiaryQueryDto, {
        search: 'ahmed',
        status: BeneficiaryStatus.ACTIVE,
        caseType: CaseType.PSYCHOLOGICAL,
        specialistId: '550e8400-e29b-41d4-a716-446655440000',
        page: 1,
        limit: 20,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('AssignSpecialistDto', () => {
    it('should pass with valid UUID', async () => {
      const dto = plainToInstance(AssignSpecialistDto, {
        specialistId: '550e8400-e29b-41d4-a716-446655440000',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without specialistId', async () => {
      const dto = plainToInstance(AssignSpecialistDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateBeneficiaryFileDto', () => {
    it('should pass with no data', async () => {
      const dto = plainToInstance(UpdateBeneficiaryFileDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept medical/educational/family history', async () => {
      const dto = plainToInstance(UpdateBeneficiaryFileDto, {
        medicalHistory: 'No allergies',
        educationalHistory: 'Regular school',
        familyHistory: 'No hereditary conditions',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept assessmentResults', async () => {
      const dto = plainToInstance(UpdateBeneficiaryFileDto, {
        assessmentResults: { iq: 100 },
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
