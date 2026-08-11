'use client';

import { useMemo } from 'react';

import { useAuthStore } from '@/store/auth.store';
import { usePermissionsStore } from '@/store/permissions.store';
import { UserRole } from '@/types';

export type Permission = string;

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'dashboard:view','dashboard:stats','dashboard:performance',
    'beneficiary:view_all','beneficiary:create','beneficiary:update',
    'beneficiary:archive','beneficiary:assign',
    'file:view','file:update',
    'appointment:view_all','appointment:create','appointment:update',
    'appointment:cancel','appointment:confirm',
    'session:view_all','session:create','session:update','session:confirm_attendance',
    'report:view_all','report:create','report:update','report:approve','report:export',
    'payment:view','payment:create','payment:update',
    'user:view','user:create','user:update','user:deactivate',
    'tenant:view','tenant:manage',
    'profile:view_self','profile:update_self',
    'notification:view','audit:view',
  ],
  center_manager: [
    'dashboard:view','dashboard:stats','dashboard:performance',
    'beneficiary:view_all','beneficiary:create','beneficiary:update',
    'beneficiary:archive','beneficiary:assign',
    'file:view','file:update',
    'appointment:view_all','appointment:create','appointment:update',
    'appointment:cancel','appointment:confirm',
    'session:view_all','session:create','session:update','session:confirm_attendance',
    'report:view_all','report:create','report:update','report:approve','report:export',
    'payment:view','payment:create','payment:update',
    'user:view','user:create','user:update','user:deactivate',
    'tenant:view',
    'profile:view_self','profile:update_self','notification:view','audit:view',
  ],
  supervisor: [
    'dashboard:view','dashboard:stats','dashboard:performance',
    'beneficiary:view_all','file:view',
    'appointment:view_all','session:view_all',
    'report:view_all','report:approve','report:export',
    'profile:view_self','profile:update_self','notification:view',
  ],
  specialist: [
    'dashboard:view','dashboard:stats',
    'beneficiary:view_own','beneficiary:create','beneficiary:update','beneficiary:assign',
    'file:view','file:update',
    'appointment:view_own','appointment:create','appointment:update',
    'appointment:cancel','appointment:confirm',
    'session:view_own','session:create','session:update','session:confirm_attendance',
    'report:view_own','report:create','report:update',
    'profile:view_self','profile:update_self','notification:view',
  ],
  receptionist: [
    'dashboard:view',
    'beneficiary:view_all','beneficiary:create','beneficiary:update',
    'appointment:view_all','appointment:create','appointment:update',
    'appointment:cancel','appointment:confirm',
    'file:view',
    'profile:view_self','profile:update_self','notification:view',
  ],
  accountant: [
    'dashboard:view','dashboard:stats',
    'beneficiary:view_all',
    'payment:view','payment:create','payment:update',
    'report:view_all','report:export',
    'profile:view_self','profile:update_self','notification:view',
  ],
  beneficiary: [
    'beneficiary:view_self','file:view_self',
    'appointment:view_self','report:view_shared',
    'profile:view_self','profile:update_self','notification:view',
  ],
};

const EMPTY_PERMISSIONS: Permission[] = [];

export function usePermissions() {
  const { user } = useAuthStore();
  const store = usePermissionsStore();

  return useMemo(() => {
    if (!user) {
      return {
        can:            () => false,
        canAny:         () => false,
        canAll:         () => false,
        hasRole:        () => false,
        hasAnyRole:     () => false,
        isAdmin:        false,
        isSpecialist:   false,
        isBeneficiary:  false,
        isSuperAdmin:   false,
        canWrite:       false,
        user:           null,
        permissions:    EMPTY_PERMISSIONS,
      };
    }

    const dynamicPermissions = store.loaded && store.permissions.length > 0
      ? store.permissions
      : null;

    const hardcodedPermissions = ROLE_PERMISSIONS[user.role] ?? [];
    const permissions = dynamicPermissions ?? hardcodedPermissions;

    const can        = (p: Permission)        => permissions.includes(p);
    const canAny     = (...ps: Permission[])  => ps.some(can);
    const canAll     = (...ps: Permission[])  => ps.every(can);
    const hasRole    = (r: UserRole)          => user.role === r;
    const hasAnyRole = (...rs: UserRole[])    => rs.includes(user.role);

    const ADMIN_ROLES: UserRole[]  = ['super_admin','center_manager','supervisor','accountant'];
    const WRITER_ROLES: UserRole[] = ['super_admin','center_manager','specialist','receptionist'];

    return {
      can,
      canAny,
      canAll,
      hasRole,
      hasAnyRole,
      isAdmin:       ADMIN_ROLES.includes(user.role),
      isSpecialist:  user.role === 'specialist',
      isBeneficiary: user.role === 'beneficiary',
      isSuperAdmin:  user.role === 'super_admin',
      canWrite:      WRITER_ROLES.includes(user.role),
      user,
      permissions,
    };
  }, [user, store.loaded, store.permissions]);
}
