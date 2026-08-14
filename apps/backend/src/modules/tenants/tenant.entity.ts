import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '@database/abstract.entity';
import { timestampColumnType } from '@database/dialect';

export enum TenantType {
  CLINIC = 'clinic',
  REHABILITATION = 'rehabilitation',
  EDUCATIONAL = 'educational',
  SUPPORT = 'support',
}

export enum SubscriptionPlan {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

@Entity('tenants')
export class Tenant extends AbstractEntity {
  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'varchar', enum: TenantType, default: TenantType.CLINIC })
  type: TenantType;

  @Column({
    name: 'subscription_plan',
    type: 'varchar',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.BASIC,
  })
  subscriptionPlan: SubscriptionPlan;

  @Column({ name: 'subscription_expires_at', type: timestampColumnType, nullable: true })
  subscriptionExpiresAt: Date;

  @Column({ name: 'max_users', default: 10 })
  maxUsers: number;

  @Column({ name: 'max_beneficiaries', default: 100 })
  maxBeneficiaries: number;

  @Column({ type: 'simple-json', nullable: true })
  settings: Record<string, any>;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
