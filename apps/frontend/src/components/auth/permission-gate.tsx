'use client';

import { usePermissions, Permission } from '@/hooks/use-permissions';
import { UserRole } from '@/types';

interface PermissionGateProps {
  children: React.ReactNode;
  /** صلاحية واحدة مطلوبة */
  permission?: Permission;
  /** أي صلاحية من المجموعة */
  anyPermission?: Permission[];
  /** جميع الصلاحيات مطلوبة */
  allPermissions?: Permission[];
  /** دور محدد */
  role?: UserRole;
  /** أي دور من المجموعة */
  anyRole?: UserRole[];
  /** أخصائيون فقط */
  writerOnly?: boolean;
  /** إدارة فقط */
  adminOnly?: boolean;
  /** مستفيدون فقط */
  beneficiaryOnly?: boolean;
  /** ما يُعرض عند رفض الوصول */
  fallback?: React.ReactNode;
}

/**
 * PermissionGate — يخفي المحتوى إن لم تتوفر الصلاحية
 *
 * @example
 * // إخفاء زر الإضافة عن المدير
 * <PermissionGate permission="beneficiary:create">
 *   <button>إضافة مستفيد</button>
 * </PermissionGate>
 *
 * // عرض بديل
 * <PermissionGate permission="report:approve" fallback={<p>للاطلاع فقط</p>}>
 *   <ApproveButton />
 * </PermissionGate>
 *
 * // أي دور من المجموعة
 * <PermissionGate anyRole={['specialist', 'receptionist']}>
 *   <NewAppointmentForm />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  permission,
  anyPermission,
  allPermissions,
  role,
  anyRole,
  writerOnly,
  adminOnly,
  beneficiaryOnly,
  fallback = null,
}: PermissionGateProps) {
  const { can, canAny, canAll, hasRole, hasAnyRole, isAdmin, canWrite, isBeneficiary } =
    usePermissions();

  if (permission     && !can(permission))              return <>{fallback}</>;
  if (anyPermission  && !canAny(...anyPermission))     return <>{fallback}</>;
  if (allPermissions && !canAll(...allPermissions))    return <>{fallback}</>;
  if (role           && !hasRole(role))                return <>{fallback}</>;
  if (anyRole        && !hasAnyRole(...anyRole))       return <>{fallback}</>;
  if (writerOnly     && !canWrite)                     return <>{fallback}</>;
  if (adminOnly      && !isAdmin)                      return <>{fallback}</>;
  if (beneficiaryOnly && !isBeneficiary)               return <>{fallback}</>;

  return <>{children}</>;
}
