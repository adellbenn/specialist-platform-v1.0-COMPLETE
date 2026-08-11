import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateSessionDto,
  UpdateSessionDto,
  SessionQueryDto,
} from '../session.dto';
import { AttendanceStatus } from '../../session.entity';

describe('Session DTOs', () => {
  describe('CreateSessionDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(CreateSessionDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        specialistId: '550e8400-e29b-41d4-a716-446655440001',
        startedAt: '2026-06-15T10:00:00',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without beneficiaryId', async () => {
      const dto = plainToInstance(CreateSessionDto, {
        specialistId: '550e8400-e29b-41d4-a716-446655440001',
        startedAt: '2026-06-15T10:00:00',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without specialistId', async () => {
      const dto = plainToInstance(CreateSessionDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        startedAt: '2026-06-15T10:00:00',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without startedAt', async () => {
      const dto = plainToInstance(CreateSessionDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        specialistId: '550e8400-e29b-41d4-a716-446655440001',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept all optional fields', async () => {
      const dto = plainToInstance(CreateSessionDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        specialistId: '550e8400-e29b-41d4-a716-446655440001',
        startedAt: '2026-06-15T10:00:00',
        endedAt: '2026-06-15T11:00:00',
        actualDurationMinutes: 55,
        attendance: AttendanceStatus.PRESENT,
        moodAssessment: 7,
        objectivesMet: true,
        sessionNotes: 'Good session',
        interventionsUsed: ['CBT', 'Play Therapy'],
        homeworkAssigned: 'Practice relaxation',
        nextSessionPlan: 'Continue CBT',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with moodAssessment < 1', async () => {
      const dto = plainToInstance(CreateSessionDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        specialistId: '550e8400-e29b-41d4-a716-446655440001',
        startedAt: '2026-06-15T10:00:00',
        moodAssessment: 0,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with moodAssessment > 10', async () => {
      const dto = plainToInstance(CreateSessionDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        specialistId: '550e8400-e29b-41d4-a716-446655440001',
        startedAt: '2026-06-15T10:00:00',
        moodAssessment: 11,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateSessionDto', () => {
    it('should pass with partial data', async () => {
      const dto = plainToInstance(UpdateSessionDto, { sessionNotes: 'Updated' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('SessionQueryDto', () => {
    it('should pass with no data', async () => {
      const dto = plainToInstance(SessionQueryDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept valid query params', async () => {
      const dto = plainToInstance(SessionQueryDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        specialistId: '550e8400-e29b-41d4-a716-446655440001',
        attendance: AttendanceStatus.PRESENT,
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
        page: 1,
        limit: 20,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
