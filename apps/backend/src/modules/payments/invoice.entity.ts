import { Entity, Column, Index, ManyToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { AbstractEntity } from '@database/abstract.entity';
import { timestampColumnType } from '@database/dialect';
import { Tenant } from '@modules/tenants/tenant.entity';
import { User } from '@modules/users/user.entity';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';
import { Subscription } from './subscription.entity';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  INSURANCE = 'insurance',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  REFUNDED = 'refunded',
}

@Entity('invoices')
@Index(['tenantId', 'paymentStatus'])
@Index(['tenantId', 'beneficiaryId'])
export class Invoice extends AbstractEntity {
  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'invoice_number' })
  invoiceNumber: string;

  @Column({ name: 'beneficiary_id' })
  @Index()
  beneficiaryId: string;

  @ManyToOne(() => Beneficiary)
  @JoinColumn({ name: 'beneficiary_id' })
  beneficiary: Beneficiary;

  @Column({ name: 'subscription_id', nullable: true })
  @Index()
  subscriptionId: string;

  @ManyToOne(() => Subscription, { nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ name: 'payment_method', type: 'varchar', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod;

  @Column({
    name: 'payment_status',
    type: 'varchar',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @Index()
  paymentStatus: PaymentStatus;

  @Column({ name: 'paid_at', type: timestampColumnType, nullable: true })
  paidAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by', nullable: true })
  @Index()
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;
}
