import { Entity, Column, Index, ManyToOne, OneToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { AbstractEntity } from '@database/abstract.entity';
import { Tenant } from '@modules/tenants/tenant.entity';
import { User } from '@modules/users/user.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum CaseType {
  PSYCHOLOGICAL = 'psychological',
  EDUCATIONAL = 'educational',
  SPEECH = 'speech',
  OCCUPATIONAL = 'occupational',
  SOCIAL = 'social',
}

export enum BeneficiaryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum ReferralSource {
  SELF = 'self',
  HOSPITAL = 'hospital',
  SCHOOL = 'school',
  OTHER = 'other',
}

@Entity('beneficiaries')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'caseType'])
export class Beneficiary extends AbstractEntity {
  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string | null;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'file_number' })
  @Index()
  fileNumber: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'varchar', enum: Gender, nullable: true })
  gender: Gender;

  @Column({ name: 'national_id', nullable: true })
  nationalId: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'guardian_name', nullable: true })
  guardianName: string;

  @Column({ name: 'guardian_phone', nullable: true })
  guardianPhone: string;

  @Column({ name: 'guardian_relationship', nullable: true })
  guardianRelationship: string;

  @Column({
    name: 'referral_source',
    type: 'varchar',
    enum: ReferralSource,
    nullable: true,
  })
  referralSource: ReferralSource;

  @Column({ name: 'case_type', type: 'varchar', enum: CaseType })
  @Index()
  caseType: CaseType;

  @Column({
    type: 'varchar',
    enum: BeneficiaryStatus,
    default: BeneficiaryStatus.ACTIVE,
  })
  @Index()
  status: BeneficiaryStatus;

  @Column({ name: 'assigned_specialist_id', nullable: true })
  @Index()
  assignedSpecialistId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_specialist_id' })
  assignedSpecialist: User;

  @Column({ name: 'intake_date', type: 'date', default: () => 'CURRENT_DATE' })
  intakeDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by', nullable: true })
  @Index()
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
