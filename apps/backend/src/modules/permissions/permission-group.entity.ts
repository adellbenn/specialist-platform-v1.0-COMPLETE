import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { AbstractEntity } from '@database/abstract.entity';
import { Permission } from './permission.entity';

@Entity('permission_groups')
export class PermissionGroup extends AbstractEntity {
  @Column({ length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 20, default: '#6B5B95' })
  color: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isSystem: boolean;

  @Column({ name: 'created_by', nullable: true })
  createdById: string;

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'group_permissions',
    joinColumn: { name: 'group_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];
}
