import { BeneficiaryFile, GoalItem, DiagnosisItem } from '../beneficiary-file.entity';

describe('BeneficiaryFile Entity', () => {
  describe('BeneficiaryFile class', () => {
    it('should be instantiable', () => {
      const file = new BeneficiaryFile();
      expect(file).toBeInstanceOf(BeneficiaryFile);
    });

    it('should allow setting all properties', () => {
      const file = new BeneficiaryFile();
      file.beneficiaryId = 'ben-1';
      file.tenantId = 'tenant-1';
      file.diagnosis = [{ code: 'F84.0', name: 'Autism', date: '2026-01-01' }];
      file.medicalHistory = 'Medical history text';
      file.educationalHistory = 'Educational history text';
      file.familyHistory = 'Family history text';
      file.assessmentResults = { iq: 100, adaptive: 'average' };
      file.goals = [
        {
          id: 'g1',
          description: 'Improve speech',
          targetDate: '2026-06-01',
          status: 'in_progress',
          notes: 'Progressing well',
        },
      ];
      file.createdById = 'user-1';

      expect(file.beneficiaryId).toBe('ben-1');
      expect(file.tenantId).toBe('tenant-1');
      expect(file.diagnosis).toHaveLength(1);
      expect(file.diagnosis![0].code).toBe('F84.0');
      expect(file.medicalHistory).toBe('Medical history text');
      expect(file.educationalHistory).toBe('Educational history text');
      expect(file.familyHistory).toBe('Family history text');
      expect(file.assessmentResults).toEqual({ iq: 100, adaptive: 'average' });
      expect(file.goals).toHaveLength(1);
      expect(file.goals![0].status).toBe('in_progress');
    });

    it('should allow nullable fields to be undefined', () => {
      const file = new BeneficiaryFile();
      expect(file.diagnosis).toBeUndefined();
      expect(file.medicalHistory).toBeUndefined();
      expect(file.educationalHistory).toBeUndefined();
      expect(file.familyHistory).toBeUndefined();
      expect(file.assessmentResults).toBeUndefined();
      expect(file.goals).toBeUndefined();
      expect(file.createdById).toBeUndefined();
    });

    it('should extend AbstractEntity and be a constructor', () => {
      expect(typeof BeneficiaryFile).toBe('function');
    });
  });

  describe('GoalItem interface', () => {
    it('should accept valid goal item', () => {
      const goal: GoalItem = {
        id: 'g1',
        description: 'Test goal',
        targetDate: '2026-12-31',
        status: 'pending',
      };
      expect(goal.id).toBe('g1');
      expect(goal.status).toBe('pending');
    });

    it('should accept all valid statuses', () => {
      const statuses: GoalItem['status'][] = ['pending', 'in_progress', 'achieved', 'cancelled'];
      statuses.forEach((status) => {
        const goal: GoalItem = {
          id: 'g1',
          description: 'Test',
          targetDate: '2026-12-31',
          status,
        };
        expect(goal.status).toBe(status);
      });
    });
  });

  describe('DiagnosisItem interface', () => {
    it('should accept valid diagnosis item with all fields', () => {
      const diag: DiagnosisItem = {
        code: 'F84.0',
        name: 'Autism',
        date: '2026-01-01',
        diagnosedBy: 'Dr. Smith',
        notes: 'Some notes',
      };
      expect(diag.code).toBe('F84.0');
      expect(diag.diagnosedBy).toBe('Dr. Smith');
    });

    it('should accept minimal diagnosis item', () => {
      const diag: DiagnosisItem = {
        name: 'ADHD',
        date: '2026-01-01',
      };
      expect(diag.code).toBeUndefined();
      expect(diag.diagnosedBy).toBeUndefined();
      expect(diag.notes).toBeUndefined();
    });
  });
});
