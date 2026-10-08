'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions, Permission } from '@/hooks/use-permissions';
import { UserRole } from '@/types';
import { PageLoader } from '@/components/ui/spinner';
import { useAuthStore } from '@/store/auth.store';
import { usePermissionsStore } from '@/store/permissions.store';

interface RouteGuardOptions {
  permission?:      Permission;
  anyPermission?:   Permission[];
  role?:            UserRole;
  anyRole?:         UserRole[];
  redirectTo?:      string;
}

/**
 * useRouteGuard — يحمي صفحة كاملة
 * يعيد التوجيه إذا لم تتوفر الصلاحية
 *
 * ⚠️ هذا خطّاف تنفيذي فقط: `router.replace` داخل useEffect لا يمنع رسم الصفحة،
 *    ولا يوقف `useEffect` الخاص بجلب البيانات في نفس دورة الرسم. لذلك لا يُعتمد
 *    كخط حماية فعلي، ونقطة الفرض الوحيدة هي `getRoutePolicy` في
 *    `src/lib/route-policy.ts` عبر `src/app/dashboard/layout.tsx` (قبل تركيب children).
 *    أبقِ هذا الاستدعاء كطبقة ثانية، وأضف أي مسار جديد إلى policy map.
 *
 * @example
 * export default function UsersPage() {
 *   useRouteGuard({ permission: 'user:view' });
 *   return <UsersContent />;
 * }
 */
export function useRouteGuard(opts: RouteGuardOptions) {
  const { can, canAny, hasRole, hasAnyRole, hasAuthority } = usePermissions();
  const { isAuthenticated, _hydrated } = useAuthStore();
  const permissionStatus = usePermissionsStore((s) => s.status);
  const router = useRouter();

  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (!_hydrated) return;
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    /* لا قرار قبل وجود سلطة: `can()` يُرجع false أثناء الانتظار، فالحكم الآن
       كان يحوّل كل مستخدم إلى /dashboard لمجرد أن الجلب لم ينتهِ بعد.
       البوابة الحقيقية في `dashboard/layout.tsx` هي من يمنع التركيب. */
    if (!hasAuthority) return;

    const o = optsRef.current;
    let allowed = true;
    if (o.permission    && !can(o.permission))           allowed = false;
    if (o.anyPermission && !canAny(...o.anyPermission))  allowed = false;
    if (o.role          && !hasRole(o.role))             allowed = false;
    if (o.anyRole       && !hasAnyRole(...o.anyRole))    allowed = false;

    if (!allowed) router.replace(o.redirectTo ?? '/dashboard');
  }, [isAuthenticated, _hydrated, hasAuthority, permissionStatus, can, canAny, hasRole, hasAnyRole, router]);
}

/**
 * withPermission — HOC لحماية صفحات كاملة
 *
 * @example
 * export default withPermission(UsersPage, { permission: 'user:view' });
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  opts: RouteGuardOptions,
) {
  return function ProtectedPage(props: P) {
    const { can, canAny, hasRole, hasAnyRole, hasAuthority } = usePermissions();
    const { isAuthenticated, isLoading, _hydrated } = useAuthStore();
    const permissionStatus = usePermissionsStore((s) => s.status);
    const router = useRouter();

    const optsRef = useRef(opts);
    optsRef.current = opts;

    useEffect(() => {
      if (!_hydrated || isLoading) return;
      if (!isAuthenticated) { router.replace('/auth/login'); return; }
      /* نفس قاعدة `useRouteGuard`: لا تحويل قبل وجود سلطة */
      if (!hasAuthority) return;

      const o = optsRef.current;
      let allowed = true;
      if (o.permission    && !can(o.permission))           allowed = false;
      if (o.anyPermission && !canAny(...o.anyPermission))  allowed = false;
      if (o.role          && !hasRole(o.role))             allowed = false;
      if (o.anyRole       && !hasAnyRole(...o.anyRole))    allowed = false;

      if (!allowed) router.replace(o.redirectTo ?? '/dashboard');
    }, [isAuthenticated, isLoading, _hydrated, hasAuthority, permissionStatus, can, canAny, hasRole, hasAnyRole, router]);

    /* بلا سلطة لا يُركَّب المحتوى المحمي — نفس بوابة `dashboard/layout.tsx` */
    if (isLoading || !isAuthenticated || !hasAuthority) return <PageLoader />;

    return <Component {...props} />;
  };
}
