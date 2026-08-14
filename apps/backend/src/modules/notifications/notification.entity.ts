import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '@database/abstract.entity';
import { timestampColumnType } from '@database/dialect';
import { Tenant } from '@modules/tenants/tenant.entity';
import { User } from '@modules/users/user.entity';

export enum NotificationType {
  APPOINTMENT_REMINDER = 'appointment_reminder',
  SESSION_DUE = 'session_due',
  REPORT_DUE = 'report_due',
  PAYMENT_DUE = 'payment_due',
  REPORT_SUBMITTED = 'report_submitted',
  REPORT_APPROVED = 'report_approved',
  NEW_BENEFICIARY = 'new_beneficiary',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  SYSTEM = 'system',
}

@Entity('notifications')
@Index(['userId', 'isRead'])
export class Notification extends AbstractEntity {
  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true })
  link: string;

  @Column({ name: 'is_read', default: false })
  @Index()
  isRead: boolean;

  @Column({ name: 'read_at', type: timestampColumnType, nullable: true })
  readAt: Date;
}
