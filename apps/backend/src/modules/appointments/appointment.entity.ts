import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '@database/abstract.entity';
import { timestampColumnType } from '@database/dialect';
import { Tenant } from '@modules/tenants/tenant.entity';
import { User } from '@modules/users/user.entity';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';

export enum AppointmentType {
  INITIAL = 'initial',
  FOLLOW_UP = 'follow_up',
  ASSESSMENT = 'assessment',
  GROUP = 'group',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity('appointments')
@Index(['tenantId', 'scheduledAt'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'specialistId'])
export class Appointment extends AbstractEntity {
  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string | null;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

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

  @Column({ name: 'scheduled_at', type: timestampColumnType })
  @Index()
  scheduledAt: Date;

  @Column({ name: 'duration_minutes', default: 60 })
  durationMinutes: number;

  @Column({ type: 'varchar', enum: AppointmentType, default: AppointmentType.FOLLOW_UP })
  type: AppointmentType;

  @Column({ type: 'varchar', enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
  @Index()
  status: AppointmentStatus;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ name: 'reminder_sent_at', type: timestampColumnType, nullable: true })
  reminderSentAt: Date;

  @Column({ name: 'created_by', nullable: true })
  @Index()
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;
}
