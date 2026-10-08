'use client';

import { useMemo } from 'react';

import { useAuthStore } from '@/store/auth.store';
import { usePermissionsStore } from '@/store/permissions.store';
import { UserRole } from '@/types';

export type Permission = string;

const EMPTY_PERMISSIONS: Permission[] = [];

/**
 * usePermissions — الصلاحيات من هوية المستخدم وسلطة الـ API فقط.
 *
 * قاعدة Phase 2: **سلطة واحدة فقط هي `status === 'ready'`**. أي حالة أخرى
 * (idle / loading / revoked / error) أو عدم تطابق المالك = لا صلاحية إطلاقًا.
 *
 * لا توجد قائمة صلاحيات ثابتة احتياطية. كان `ROLE_PERMISSIONS` يُستخدم
 * كـfallback قبل أول جلب، فكان يمنح أي مستخدم بدور مسجّل كامل صلاحيات ذلك
 * الدور قبل أن يرد الخادم — وعلى الأخص بعد وصول `[]` من الـAPI.
 *
 * `hasAuthority` هو المصدر الوحيد الذي يقرأه `dashboard/layout.tsx` للبوابة،
 * فيكفي فحص واحد لضمان عدم وجود مسار ثانٍ يتخذ قرارًا مختلفًا.
 */
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
        hasAuthority:   false,
        isAdmin:        false,
        isSpecialist:   false,
        isBeneficiary:  false,
        isSuperAdmin:   false,
        canWrite:       false,
        user:           null,
        permissions:    EMPTY_PERMISSIONS,
      };
    }

    /* السلطة صالحة فقط إذا كانت `ready` **ولصاحبها نفس الهوية المعروضة الآن**.
       الشرط الثاني هو ما يمنع نافذة التصعيد عند تغيّر الدور: بعد تغيّر
       `user.role` مباشرة وقبل وصول الجلب الجديد، `ownerRole` لا يطابق →
       `hasAuthority === false` → لا قرار تفويض إطلاقًا. */
    const ownerMatches =
      store.status === 'ready' &&
      store.ownerId === user.id &&
      store.ownerRole === user.role;

    const permissions = ownerMatches ? store.permissions : EMPTY_PERMISSIONS;

    /* `can*` و `hasRole*` هي **أدوات تفويض**، فتُقفل كلها معًا خلف `ownerMatches`.
       ترك `hasRole` تعمل بعد الإبطال كان ثغرة بحد ذاتها: أي مسار محمي بـ role
       بدل permission كان سيبقى مفتوحًا بعد logout أو قبل أول جلب. */
    const can     = (p: Permission)       => ownerMatches && permissions.includes(p);
    const canAny  = (...ps: Permission[]) => ownerMatches && ps.some((p) => permissions.includes(p));
    const canAll  = (...ps: Permission[]) => ownerMatches && ps.every((p) => permissions.includes(p));
    const hasRole = (r: UserRole)         => ownerMatches && user.role === r;
    const hasAnyRole = (...rs: UserRole[]) => ownerMatches && rs.includes(user.role);

    /* ما يلي هويةٌ لا تفويض — للعرض فقط (أيقونات، تنقّل، أنماط). لا تُستخدم
       كبوابة: `PermissionGate` يرفض أولًا ما لم توجد سلطة. */
    const ADMIN_ROLES: UserRole[]  = ['super_admin','center_manager','supervisor','accountant'];
    const WRITER_ROLES: UserRole[] = ['super_admin','center_manager','specialist','receptionist'];

    return {
      can,
      canAny,
      canAll,
      hasRole,
      hasAnyRole,
      hasAuthority:   ownerMatches,
      isAdmin:        ADMIN_ROLES.includes(user.role),
      isSpecialist:   user.role === 'specialist',
      isBeneficiary:  user.role === 'beneficiary',
      isSuperAdmin:   user.role === 'super_admin',
      canWrite:       WRITER_ROLES.includes(user.role),
      user,
      permissions,
    };
  }, [user, store.status, store.ownerId, store.ownerRole, store.permissions]);
}
