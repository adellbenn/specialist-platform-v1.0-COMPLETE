import { Entity, Column, Index, ManyToMany, JoinTable } from 'typeorm';
import { AbstractEntity } from '@database/abstract.entity';
import { Role } from './role.entity';

export enum PermissionAction {
  VIEW_ALL = 'view_all',
  VIEW_OWN = 'view_own',
  VIEW_SELF = 'view_self',
  VIEW_SHARED = 'view_shared',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  ARCHIVE = 'archive',
  RESTORE = 'restore',
  IMPORT = 'import',
  EXPORT = 'export',
  APPROVE = 'approve',
  ASSIGN = 'assign',
  ASSIGN_PERMISSIONS = 'assign_permissions',
  CANCEL = 'cancel',
  CONFIRM_ATTEND = 'confirm_attendance',
  PRINT = 'print',
  SHARE = 'share',
  MANAGE = 'manage',
  CONFIRM = 'confirm',
  DEACTIVATE = 'deactivate',
  VIEW = 'view',
  STATS = 'stats',
  PERFORMANCE = 'performance',
  UPLOAD = 'upload',
  REFUND = 'refund',
  COMPARE = 'compare',
  OVERRIDE = 'override',
  AUDIT = 'audit',
  SEND = 'send',
  UPDATE_SELF = 'update_self',
}

export enum PermissionModule {
  DASHBOARD = 'dashboard',
  BENEFICIARIES = 'beneficiary',
  APPOINTMENTS = 'appointment',
  SESSIONS = 'session',
  SPECIALISTS = 'specialist',
  MEDICAL_RECORDS = 'medical_record',
  FILES = 'file',
  REPORTS = 'report',
  PAYMENTS = 'payment',
  INVOICES = 'invoice',
  USERS = 'user',
  ROLES = 'role',
  PERMISSIONS = 'permission',
  GROUPS = 'group',
  SETTINGS = 'settings',
  NOTIFICATIONS = 'notification',
  ANALYTICS = 'analytics',
  AUDIT = 'audit',
  TENANT = 'tenant',
  PROFILE = 'profile',
}

const MODULE_ACTIONS: Record<PermissionModule, PermissionAction[]> = {
  [PermissionModule.DASHBOARD]: [
    PermissionAction.VIEW,
    PermissionAction.STATS,
    PermissionAction.PERFORMANCE,
  ],
  [PermissionModule.BENEFICIARIES]: [
    PermissionAction.VIEW_ALL,
    PermissionAction.VIEW_OWN,
    PermissionAction.VIEW_SELF,
    PermissionAction.CREATE,
    PermissionAction.UPDATE,
    PermissionAction.DELETE,
    PermissionAction.ARCHIVE,
    PermissionAction.RESTORE,
    PermissionAction.ASSIGN,
    PermissionAction.IMPORT,
    PermissionAction.EXPORT,
  ],
  [PermissionModule.APPOINTMENTS]: [
    PermissionAction.VIEW_ALL,
    PermissionAction.VIEW_OWN,
    PermissionAction.VIEW_SELF,
    PermissionAction.CREATE,
    PermissionAction.UPDATE,
    PermissionAction.CANCEL,
    PermissionAction.CONFIRM,
    PermissionAction.EXPORT,
  ],
  [PermissionModule.SESSIONS]: [
    PermissionAction.VIEW_ALL,
    PermissionAction.VIEW_OWN,
    PermissionAction.CREATE,
    PermissionAction.UPDATE,
    PermissionAction.CONFIRM,
    PermissionAction.CONFIRM_ATTEND,
    PermissionAction.EXPORT,
  ],
  [PermissionModule.SPECIALISTS]: [
    PermissionAction.VIEW_ALL,
    PermissionAction.VIEW_OWN,
    PermissionAction.CREATE,
    PermissionAction.UPDATE,
    PermissionAction.ARCHIVE,
    PermissionAction.ASSIGN,
  ],
  [PermissionModule.MEDICAL_RECORDS]: [
    PermissionAction.VIEW_ALL,
    PermissionAction.VIEW_OWN,
    PermissionAction.CREATE,
    PermissionAction.UPDATE,
    PermissionAction.DELETE,
    PermissionAction.EXPORT,
    PermissionAction.PRINT,
    PermissionAction.SHARE,
  ],
  [PermissionModule.FILES]: [
    PermissionAction.VIEW,
    PermissionAction.VIEW_SELF,
    PermissionAction.UPDATE,
    PermissionAction.DELETE,
    PermissionAction.UPLOAD,
    PermissionAction.EXPORT,
  ],
  [PermissionModule.REPORTS]: [
    PermissionAction.VIEW_ALL,
    PermissionAction.VIEW_OWN,
    PermissionAction.VIEW_SHARED,
    PermissionAction.CREATE,
    PermissionAction.UPDATE,
    PermissionAction.APPROVE,
    PermissionAction.EXPORT,
    PermissionAction.DELETE,
    PermissionAction.PRINT,
  ],
  [PermissionModule.PAYMENTS]: [
    PermissionAction.VIEW,
    PermissionAction.CREATE,
    PermissionAction.UPDATE,
    PermissionAction.DELETE,
    PermissionAction.EXPORT,
    PermissionAction.APPROVE,
    PermissionAction.REFUND,
  ],
  [PermissionModule.INVOICES]: [
    PermissionAction.VIEW,
    PermissionAction.CREATE,
    PermissionAction.UPDATE,
    PermissionAction.DELETE,
    PermissionAction.PRINT,
    PermissionAction.EXPORT,
    PermissionAction.SHARE,
  ],
  [PermissionModule.USERS]: [
    PermissionAction.VIEW,
    PermissionAction.CREATE,
    PermissionAction.UPDATE,
    PermissionAction.DELETE,
    PermissionAction.DEACTIVATE,
    PermissionAction.OVERRIDE,
    PermissionAction.IMPORT,
    PermissionAction.EXPORT,
  ],
  [PermissionModule.ROLES]: [
    PermissionAction.VIEW,
    PermissionAction.CREATE,
    PermissionAction.UPDATE,
    PermissionAction.DELETE,
    PermissionAction.ASSIGN_PERMISSIONS,
    PermissionAction.ARCHIVE,
    PermissionAction.MANAGE,
    PermissionAction.COMPARE,
  ],
  [PermissionModule.PERMISSIONS]: [
    PermissionAction.VIEW,
    PermissionAction.MANAGE,
    PermissionAction.ASSIGN,
    PermissionAction.OVERRIDE,
    PermissionAction.AUDIT,
  ],
  [PermissionModule.GROUPS]: [
    PermissionAction.VIEW,
    PermissionAction.CREATE,
    PermissionAction.UPDATE,
    PermissionAction.DELETE,
  ],
  [PermissionModule.SETTINGS]: [
    PermissionAction.VIEW,
    PermissionAction.UPDATE,
    PermissionAction.MANAGE,
  ],
  [PermissionModule.NOTIFICATIONS]: [
    PermissionAction.VIEW,
    PermissionAction.MANAGE,
    PermissionAction.SEND,
  ],
  [PermissionModule.ANALYTICS]: [
    PermissionAction.VIEW,
    PermissionAction.EXPORT,
    PermissionAction.MANAGE,
  ],
  [PermissionModule.AUDIT]: [PermissionAction.VIEW, PermissionAction.EXPORT],
  [PermissionModule.TENANT]: [PermissionAction.VIEW, PermissionAction.MANAGE],
  [PermissionModule.PROFILE]: [PermissionAction.VIEW_SELF, PermissionAction.UPDATE_SELF],
};

export function getAllModuleActions(): Array<{
  module: PermissionModule;
  action: PermissionAction;
  key: string;
}> {
  const result: Array<{ module: PermissionModule; action: PermissionAction; key: string }> = [];
  for (const mod of Object.values(PermissionModule)) {
    const actions = MODULE_ACTIONS[mod] || [];
    for (const action of actions) {
      result.push({ module: mod, action, key: `${mod}:${action}` });
    }
  }
  return result;
}

@Entity('permissions')
@Index(['module', 'action'], { unique: true })
export class Permission extends AbstractEntity {
  @Column({ type: 'varchar', length: 50 })
  module: PermissionModule;

  @Column({ type: 'varchar', length: 50 })
  action: PermissionAction;

  @Column({ name: 'display_name', length: 100 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_system', default: true })
  isSystem: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
