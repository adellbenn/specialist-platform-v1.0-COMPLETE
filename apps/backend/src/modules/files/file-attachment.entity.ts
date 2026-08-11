import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '@database/abstract.entity';
import { Tenant } from '@modules/tenants/tenant.entity';
import { User } from '@modules/users/user.entity';

export enum EntityType {
  BENEFICIARY = 'beneficiary',
  SESSION = 'session',
  REPORT = 'report',
  INVOICE = 'invoice',
}

@Entity('file_attachments')
@Index(['tenantId', 'entityType', 'entityId'])
export class FileAttachment extends AbstractEntity {
  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'entity_type', type: 'varchar', enum: EntityType })
  @Index()
  entityType: EntityType;

  /** UUID الكيان المرتبط (مستفيد، جلسة، تقرير...) */
  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ name: 'original_name' })
  originalName: string;

  @Column({ name: 'uploaded_by', nullable: true })
  @Index()
  uploadedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User;
}
