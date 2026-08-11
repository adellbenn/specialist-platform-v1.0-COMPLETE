import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '@database/abstract.entity';
import { Tenant } from '@modules/tenants/tenant.entity';
import { User } from '@modules/users/user.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  APPROVE = 'APPROVE',
  SUBMIT = 'SUBMIT',
}

@Entity('audit_logs')
@Index(['tenantId', 'action'])
@Index(['tenantId', 'entityType'])
@Index(['tenantId', 'createdAt'])
export class AuditLog extends AbstractEntity {
  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', enum: AuditAction })
  @Index()
  action: AuditAction;

  @Column({ name: 'entity_type' })
  @Index()
  entityType: string;

  @Column({ name: 'entity_id', nullable: true })
  entityId: string;

  @Column({ name: 'old_values', type: 'simple-json', nullable: true })
  oldValues: Record<string, any>;

  @Column({ name: 'new_values', type: 'simple-json', nullable: true })
  newValues: Record<string, any>;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}
