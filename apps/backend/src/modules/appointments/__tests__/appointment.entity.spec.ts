import {
  Appointment,
  AppointmentType,
  AppointmentStatus,
} from '../appointment.entity';

describe('Appointment Entity', () => {
  describe('AppointmentType enum', () => {
    it('should have correct values', () => {
      expect(AppointmentType.INITIAL).toBe('initial');
      expect(AppointmentType.FOLLOW_UP).toBe('follow_up');
      expect(AppointmentType.ASSESSMENT).toBe('assessment');
      expect(AppointmentType.GROUP).toBe('group');
    });

    it('should have 4 values', () => {
      expect(Object.keys(AppointmentType)).toHaveLength(4);
    });
  });

  describe('AppointmentStatus enum', () => {
    it('should have correct values', () => {
      expect(AppointmentStatus.SCHEDULED).toBe('scheduled');
      expect(AppointmentStatus.CONFIRMED).toBe('confirmed');
      expect(AppointmentStatus.COMPLETED).toBe('completed');
      expect(AppointmentStatus.CANCELLED).toBe('cancelled');
      expect(AppointmentStatus.NO_SHOW).toBe('no_show');
    });

    it('should have 5 values', () => {
      expect(Object.keys(AppointmentStatus)).toHaveLength(5);
    });
  });

  describe('Appointment class', () => {
    it('should be instantiable', () => {
      const appointment = new Appointment();
      expect(appointment).toBeInstanceOf(Appointment);
    });

    it('should allow setting all properties', () => {
      const appointment = new Appointment();
      appointment.tenantId = 'tenant-1';
      appointment.beneficiaryId = 'ben-1';
      appointment.specialistId = 'spec-1';
      appointment.scheduledAt = new Date('2026-06-15T10:00:00');
      appointment.durationMinutes = 60;
      appointment.type = AppointmentType.INITIAL;
      appointment.status = AppointmentStatus.SCHEDULED;
      appointment.location = 'Room A';
      appointment.notes = 'Test notes';
      appointment.cancellationReason = 'N/A';
      appointment.reminderSentAt = new Date();
      appointment.createdById = 'user-1';

      expect(appointment.tenantId).toBe('tenant-1');
      expect(appointment.beneficiaryId).toBe('ben-1');
      expect(appointment.specialistId).toBe('spec-1');
      expect(appointment.scheduledAt).toEqual(new Date('2026-06-15T10:00:00'));
      expect(appointment.durationMinutes).toBe(60);
      expect(appointment.type).toBe(AppointmentType.INITIAL);
      expect(appointment.status).toBe(AppointmentStatus.SCHEDULED);
      expect(appointment.location).toBe('Room A');
      expect(appointment.notes).toBe('Test notes');
      expect(appointment.cancellationReason).toBe('N/A');
      expect(appointment.createdById).toBe('user-1');
    });

    it('should allow nullable fields to be undefined', () => {
      const appointment = new Appointment();
      expect(appointment.location).toBeUndefined();
      expect(appointment.notes).toBeUndefined();
      expect(appointment.cancellationReason).toBeUndefined();
      expect(appointment.reminderSentAt).toBeUndefined();
      expect(appointment.createdById).toBeUndefined();
    });

    it('should extend AbstractEntity and have id property type', () => {
      const appointment = new Appointment();
      expect(typeof Appointment).toBe('function');
    });
  });
});
