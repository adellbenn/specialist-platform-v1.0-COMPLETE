import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentQueryDto,
} from '../appointment.dto';
import { AppointmentType, AppointmentStatus } from '../../appointment.entity';

describe('Appointment DTOs', () => {
  describe('CreateAppointmentDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        specialistId: '550e8400-e29b-41d4-a716-446655440001',
        scheduledAt: '2026-06-15T10:00:00',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail without beneficiaryId', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        specialistId: '550e8400-e29b-41d4-a716-446655440001',
        scheduledAt: '2026-06-15T10:00:00',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without specialistId', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        scheduledAt: '2026-06-15T10:00:00',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without scheduledAt', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        specialistId: '550e8400-e29b-41d4-a716-446655440001',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept optional fields', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        specialistId: '550e8400-e29b-41d4-a716-446655440001',
        scheduledAt: '2026-06-15T10:00:00',
        durationMinutes: 90,
        type: AppointmentType.INITIAL,
        location: 'Room A',
        notes: 'Test',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.durationMinutes).toBe(90);
      expect(dto.type).toBe(AppointmentType.INITIAL);
    });

    it('should fail with invalid durationMinutes (min 15)', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        beneficiaryId: '550e8400-e29b-41d4-a716-446655440000',
        specialistId: '550e8400-e29b-41d4-a716-446655440001',
        scheduledAt: '2026-06-15T10:00:00',
        durationMinutes: 5,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with invalid UUID for beneficiaryId', async () => {
      const dto = plainToInstance(CreateAppointmentDto, {
        beneficiaryId: 'not-a-uuid',
        specialistId: '550e8400-e29b-41d4-a716-446655440001',
        scheduledAt: '2026-06-15T10:00:00',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateAppointmentDto', () => {
    it('should pass with partial data', async () => {
      const dto = plainToInstance(UpdateAppointmentDto, { notes: 'Updated' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept status field', async () => {
      const dto = plainToInstance(UpdateAppointmentDto, {
        status: AppointmentStatus.CONFIRMED,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept cancellationReason', async () => {
      const dto = plainToInstance(UpdateAppointmentDto, {
        cancellationReason: 'Patient request',
        status: AppointmentStatus.CANCELLED,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('AppointmentQueryDto', () => {
    it('should pass with no data (all optional)', async () => {
      const dto = plainToInstance(AppointmentQueryDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept valid query params', async () => {
      const dto = plainToInstance(AppointmentQueryDto, {
        specialistId: '550e8400-e29b-41d4-a716-446655440000',
        status: AppointmentStatus.SCHEDULED,
        type: AppointmentType.FOLLOW_UP,
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
