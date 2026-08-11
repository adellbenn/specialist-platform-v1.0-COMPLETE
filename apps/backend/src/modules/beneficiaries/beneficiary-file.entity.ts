import { Entity, Column, Index, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '@database/abstract.entity';
import { Beneficiary } from './beneficiary.entity';
import { Tenant } from '@modules/tenants/tenant.entity';
import { User } from '@modules/users/user.entity';

export interface GoalItem {
  id: string;
  description: string;
  targetDate: string;
  status: 'pending' | 'in_progress' | 'achieved' | 'cancelled';
  notes?: string;
}

export interface DiagnosisItem {
  code?: string; // ICD-10 or DSM-5
  name: string;
  date: string;
  diagnosedBy?: string;
  notes?: string;
}

@Entity('beneficiary_files')
@Index(['beneficiaryId', 'tenantId'])
export class BeneficiaryFile extends AbstractEntity {
  @Column({ name: 'beneficiary_id' })
  @Index()
  beneficiaryId: string;

  @OneToOne(() => Beneficiary)
  @JoinColumn({ name: 'beneficiary_id' })
  beneficiary: Beneficiary;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // التشخيص — مصفوفة مرنة من JSONB
  @Column({ type: 'simple-json', nullable: true })
  diagnosis: DiagnosisItem[];

  @Column({ name: 'medical_history', type: 'text', nullable: true })
  medicalHistory: string;

  @Column({ name: 'educational_history', type: 'text', nullable: true })
  educationalHistory: string;

  @Column({ name: 'family_history', type: 'text', nullable: true })
  familyHistory: string;

  // نتائج التقييمات الأولية
  @Column({ name: 'assessment_results', type: 'simple-json', nullable: true })
  assessmentResults: Record<string, any>;

  // الأهداف العلاجية / التربوية
  @Column({ type: 'simple-json', nullable: true })
  goals: GoalItem[];

  @Column({ name: 'created_by', nullable: true })
  @Index()
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;
}
