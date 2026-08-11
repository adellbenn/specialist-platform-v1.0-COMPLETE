import { Session, AttendanceStatus } from '../session.entity';

describe('Session Entity', () => {
  describe('AttendanceStatus enum', () => {
    it('should have correct values', () => {
      expect(AttendanceStatus.PRESENT).toBe('present');
      expect(AttendanceStatus.ABSENT).toBe('absent');
      expect(AttendanceStatus.LATE).toBe('late');
      expect(AttendanceStatus.EXCUSED).toBe('excused');
    });

    it('should have 4 values', () => {
      expect(Object.keys(AttendanceStatus)).toHaveLength(4);
    });
  });

  describe('Session class', () => {
    it('should be instantiable', () => {
      const session = new Session();
      expect(session).toBeInstanceOf(Session);
    });

    it('should allow setting all properties', () => {
      const session = new Session();
      session.tenantId = 'tenant-1';
      session.appointmentId = 'apt-1';
      session.beneficiaryId = 'ben-1';
      session.specialistId = 'spec-1';
      session.sessionNumber = 5;
      session.startedAt = new Date('2026-06-15T10:00:00');
      session.endedAt = new Date('2026-06-15T11:00:00');
      session.actualDurationMinutes = 55;
      session.attendance = AttendanceStatus.PRESENT;
      session.moodAssessment = 7;
      session.objectivesMet = true;
      session.sessionNotes = 'Session notes';
      session.interventionsUsed = ['CBT', 'Play Therapy'];
      session.homeworkAssigned = 'Practice relaxation';
      session.nextSessionPlan = 'Continue CBT';

      expect(session.tenantId).toBe('tenant-1');
      expect(session.appointmentId).toBe('apt-1');
      expect(session.beneficiaryId).toBe('ben-1');
      expect(session.specialistId).toBe('spec-1');
      expect(session.sessionNumber).toBe(5);
      expect(session.startedAt).toEqual(new Date('2026-06-15T10:00:00'));
      expect(session.endedAt).toEqual(new Date('2026-06-15T11:00:00'));
      expect(session.actualDurationMinutes).toBe(55);
      expect(session.attendance).toBe(AttendanceStatus.PRESENT);
      expect(session.moodAssessment).toBe(7);
      expect(session.objectivesMet).toBe(true);
      expect(session.sessionNotes).toBe('Session notes');
      expect(session.interventionsUsed).toEqual(['CBT', 'Play Therapy']);
      expect(session.homeworkAssigned).toBe('Practice relaxation');
      expect(session.nextSessionPlan).toBe('Continue CBT');
    });

    it('should allow nullable fields to be undefined', () => {
      const session = new Session();
      expect(session.appointmentId).toBeUndefined();
      expect(session.endedAt).toBeUndefined();
      expect(session.actualDurationMinutes).toBeUndefined();
      expect(session.moodAssessment).toBeUndefined();
      expect(session.objectivesMet).toBeUndefined();
      expect(session.sessionNotes).toBeUndefined();
      expect(session.interventionsUsed).toBeUndefined();
      expect(session.homeworkAssigned).toBeUndefined();
      expect(session.nextSessionPlan).toBeUndefined();
    });

    it('should extend AbstractEntity and be a constructor', () => {
      expect(typeof Session).toBe('function');
    });
  });
});
