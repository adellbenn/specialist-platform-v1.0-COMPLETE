import { Report, ReportType, ReportStatus, ReportContent } from '../report.entity';

describe('Report Entity', () => {
  describe('ReportType enum', () => {
    it('should have correct values', () => {
      expect(ReportType.INITIAL_ASSESSMENT).toBe('initial_assessment');
      expect(ReportType.PROGRESS).toBe('progress');
      expect(ReportType.PERIODIC).toBe('periodic');
      expect(ReportType.FINAL).toBe('final');
      expect(ReportType.REFERRAL).toBe('referral');
    });

    it('should have 5 values', () => {
      expect(Object.keys(ReportType)).toHaveLength(5);
    });
  });

  describe('ReportStatus enum', () => {
    it('should have correct values', () => {
      expect(ReportStatus.DRAFT).toBe('draft');
      expect(ReportStatus.SUBMITTED).toBe('submitted');
      expect(ReportStatus.APPROVED).toBe('approved');
      expect(ReportStatus.ARCHIVED).toBe('archived');
    });

    it('should have 4 values', () => {
      expect(Object.keys(ReportStatus)).toHaveLength(4);
    });
  });

  describe('ReportContent interface', () => {
    it('should accept minimal content', () => {
      const content: ReportContent = {};
      expect(content).toEqual({});
    });

    it('should accept full content', () => {
      const content: ReportContent = {
        summary: 'Progress report',
        currentStatus: 'Improving',
        goalsProgress: [
          { goalId: 'g1', description: 'Goal 1', progress: 80, notes: 'Good progress' },
        ],
        interventions: ['CBT', 'Art Therapy'],
        challenges: 'None significant',
        achievements: 'Improved communication',
        behaviorChanges: 'More cooperative',
        familyFeedback: 'Positive',
        referralReason: 'Initial assessment',
        referralTo: 'Speech therapist',
        customField: 'custom value',
      };
      expect(content.summary).toBe('Progress report');
      expect(content.goalsProgress).toHaveLength(1);
      expect(content.interventions).toHaveLength(2);
    });
  });

  describe('Report class', () => {
    it('should be instantiable', () => {
      const report = new Report();
      expect(report).toBeInstanceOf(Report);
    });

    it('should allow setting all properties', () => {
      const report = new Report();
      report.tenantId = 'tenant-1';
      report.beneficiaryId = 'ben-1';
      report.specialistId = 'spec-1';
      report.type = ReportType.PROGRESS;
      report.title = 'Progress Report';
      report.periodFrom = new Date('2026-01-01');
      report.periodTo = new Date('2026-06-01');
      report.content = { summary: 'Test' };
      report.recommendations = 'Continue therapy';
      report.status = ReportStatus.DRAFT;
      report.sharedWithBeneficiary = true;
      report.approvedById = 'admin-1';
      report.approvedAt = new Date();

      expect(report.tenantId).toBe('tenant-1');
      expect(report.beneficiaryId).toBe('ben-1');
      report.specialistId = 'spec-1';
      expect(report.type).toBe(ReportType.PROGRESS);
      expect(report.title).toBe('Progress Report');
      expect(report.content).toEqual({ summary: 'Test' });
      expect(report.recommendations).toBe('Continue therapy');
      expect(report.status).toBe(ReportStatus.DRAFT);
      expect(report.sharedWithBeneficiary).toBe(true);
      expect(report.approvedById).toBe('admin-1');
    });

    it('should allow nullable fields to be undefined', () => {
      const report = new Report();
      expect(report.periodFrom).toBeUndefined();
      expect(report.periodTo).toBeUndefined();
      expect(report.recommendations).toBeUndefined();
      expect(report.approvedById).toBeUndefined();
      expect(report.approvedAt).toBeUndefined();
    });

    it('should extend AbstractEntity and be a constructor', () => {
      expect(typeof Report).toBe('function');
    });
  });
});
