import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateReportDto,
  UpdateReportDto,
  ReportQueryDto,
  ApproveReportDto,
} from '../report.dto';
import { ReportType, ReportStatus } from '../../report.entity';

describe('Report DTOs', () => {
  describe('CreateReportDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(CreateReportDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        type: ReportType.PROGRESS,
        title: 'Progress Report',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without beneficiaryId', async () => {
      const dto = plainToInstance(CreateReportDto, {
        type: ReportType.PROGRESS,
        title: 'Progress Report',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without type', async () => {
      const dto = plainToInstance(CreateReportDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Progress Report',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without title', async () => {
      const dto = plainToInstance(CreateReportDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        type: ReportType.PROGRESS,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept all optional fields', async () => {
      const dto = plainToInstance(CreateReportDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        type: ReportType.PERIODIC,
        title: 'Periodic Report',
        periodFrom: '2026-01-01',
        periodTo: '2026-06-01',
        content: { summary: 'Good progress' },
        recommendations: 'Continue therapy',
        sharedWithBeneficiary: true,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('UpdateReportDto', () => {
    it('should pass with partial data', async () => {
      const dto = plainToInstance(UpdateReportDto, { title: 'Updated' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept status field', async () => {
      const dto = plainToInstance(UpdateReportDto, {
        status: ReportStatus.SUBMITTED,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('ReportQueryDto', () => {
    it('should pass with no data', async () => {
      const dto = plainToInstance(ReportQueryDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept valid query params', async () => {
      const dto = plainToInstance(ReportQueryDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        specialistId: '550e8400-e29b-41d4-a716-446655440001',
        type: ReportType.PROGRESS,
        status: ReportStatus.DRAFT,
        page: 1,
        limit: 20,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('ApproveReportDto', () => {
    it('should pass with no data', async () => {
      const dto = plainToInstance(ApproveReportDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept optional notes', async () => {
      const dto = plainToInstance(ApproveReportDto, {
        notes: 'Approved with minor changes',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
