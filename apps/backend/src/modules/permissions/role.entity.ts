import { Entity, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { AbstractEntity } from '@database/abstract.entity';
import { Permission } from './permission.entity';
import { UserPermission } from './user-permission.entity';

@Entity('roles')
export class Role extends AbstractEntity {
  @Column({ length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 20, default: '#6B5B95' })
  color: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isSystem: boolean;

  @Column({ default: 0 })
  priority: number;

  @Column({ name: 'created_by', nullable: true })
  createdById: string;

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @OneToMany(() => UserPermission, (up) => up.role)
  userPermissions: UserPermission[];
}
