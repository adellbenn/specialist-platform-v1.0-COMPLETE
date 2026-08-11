import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '@database/abstract.entity';
import { Tenant } from '@modules/tenants/tenant.entity';
import { User } from '@modules/users/user.entity';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';
import { ServicePackage } from './service-package.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('subscriptions')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'beneficiaryId'])
export class Subscription extends AbstractEntity {
  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'beneficiary_id' })
  @Index()
  beneficiaryId: string;

  @ManyToOne(() => Beneficiary)
  @JoinColumn({ name: 'beneficiary_id' })
  beneficiary: Beneficiary;

  @Column({ name: 'package_id', nullable: true })
  @Index()
  packageId: string;

  @ManyToOne(() => ServicePackage, { nullable: true })
  @JoinColumn({ name: 'package_id' })
  package: ServicePackage;

  @Column({ name: 'sessions_used', default: 0 })
  sessionsUsed: number;

  @Column({ name: 'sessions_remaining' })
  sessionsRemaining: number;

  @Column({ name: 'amount_paid', type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'expiry_date', type: 'date' })
  expiryDate: Date;

  @Column({ type: 'varchar', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  @Index()
  status: SubscriptionStatus;

  @Column({ name: 'created_by', nullable: true })
  @Index()
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;
}
