import { Entity, Column, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { AbstractEntity } from '@database/abstract.entity';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

export enum OverrideType {
  GRANTED = 'granted',
  DENIED = 'denied',
}

@Entity('user_permissions')
@Unique(['userId', 'permissionId'])
export class UserPermission extends AbstractEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'permission_id' })
  permissionId: string;

  @ManyToOne(() => Permission)
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @Column({ name: 'override_type', type: 'varchar', length: 20, default: OverrideType.GRANTED })
  overrideType: OverrideType;

  @Column({ name: 'granted_by', nullable: true })
  grantedById: string;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date;

  @Column({ name: 'role_id', nullable: true })
  @Index()
  roleId: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
