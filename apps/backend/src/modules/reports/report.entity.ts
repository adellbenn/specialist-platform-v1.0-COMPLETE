import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '@database/abstract.entity';
import { timestampColumnType } from '@database/dialect';
import { Tenant } from '@modules/tenants/tenant.entity';
import { User } from '@modules/users/user.entity';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';

export enum ReportType {
  INITIAL_ASSESSMENT = 'initial_assessment',
  PROGRESS = 'progress',
  PERIODIC = 'periodic',
  FINAL = 'final',
  REFERRAL = 'referral',
}

export enum ReportStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  ARCHIVED = 'archived',
}

/** هيكل مرن للمحتوى حسب نوع التقرير */
export interface ReportContent {
  summary?: string;
  currentStatus?: string;
  goalsProgress?: Array<{ goalId: string; description: string; progress: number; notes: string }>;
  interventions?: string[];
  challenges?: string;
  achievements?: string;
  behaviorChanges?: string;
  familyFeedback?: string;
  referralReason?: string;
  referralTo?: string;
  [key: string]: any;
}

@Entity('reports')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'beneficiaryId'])
export class Report extends AbstractEntity {
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

  @Column({ type: 'varchar', enum: ReportType })
  type: ReportType;

  @Column()
  title: string;

  @Column({ name: 'period_from', type: 'date', nullable: true })
  periodFrom: Date;

  @Column({ name: 'period_to', type: 'date', nullable: true })
  periodTo: Date;

  @Column({ type: 'simple-json', default: '{}' })
  content: ReportContent;

  @Column({ type: 'text', nullable: true })
  recommendations: string;

  @Column({ type: 'varchar', enum: ReportStatus, default: ReportStatus.DRAFT })
  @Index()
  status: ReportStatus;

  /** هل يمكن للمستفيد رؤية هذا التقرير؟ */
  @Column({ name: 'shared_with_beneficiary', default: false })
  sharedWithBeneficiary: boolean;

  @Column({ name: 'approved_by', nullable: true })
  @Index()
  approvedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User;

  @Column({ name: 'approved_at', type: timestampColumnType, nullable: true })
  approvedAt: Date;
}
