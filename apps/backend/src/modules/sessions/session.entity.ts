import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '@database/abstract.entity';
import { timestampColumnType } from '@database/dialect';
import { Tenant } from '@modules/tenants/tenant.entity';
import { User } from '@modules/users/user.entity';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';
import { Appointment } from '@modules/appointments/appointment.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

@Entity('sessions')
@Index(['tenantId', 'startedAt'])
@Index(['tenantId', 'attendance'])
export class Session extends AbstractEntity {
  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string | null;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'appointment_id', nullable: true })
  @Index()
  appointmentId: string;

  @ManyToOne(() => Appointment, { nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ name: 'beneficiary_id' })
  @Index()
  beneficiaryId: string;

  @ManyToOne(() => Beneficiary)
  @JoinColumn({ name: 'beneficiary_id' })
  beneficiary: Beneficiary;

  @Column({ name: 'specialist_id' })
  @Index()
  specialistId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'specialist_id' })
  specialist: User;

  @Column({ name: 'session_number', default: 1 })
  sessionNumber: number;

  @Column({ name: 'started_at', type: timestampColumnType })
  startedAt: Date;

  @Column({ name: 'ended_at', type: timestampColumnType, nullable: true })
  endedAt: Date;

  @Column({ name: 'actual_duration_minutes', nullable: true })
  actualDurationMinutes: number;

  @Column({ type: 'varchar', enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  @Index()
  attendance: AttendanceStatus;

  @Column({ name: 'mood_assessment', type: 'smallint', nullable: true })
  moodAssessment: number;

  @Column({ name: 'objectives_met', type: 'boolean', nullable: true })
  objectivesMet: boolean;

  @Column({ name: 'session_notes', type: 'text', nullable: true })
  sessionNotes: string;

  @Column({ name: 'interventions_used', type: 'simple-json', nullable: true })
  interventionsUsed: string[];

  @Column({ name: 'homework_assigned', type: 'text', nullable: true })
  homeworkAssigned: string;

  @Column({ name: 'next_session_plan', type: 'text', nullable: true })
  nextSessionPlan: string;
}
