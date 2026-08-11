'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions, Permission } from '@/hooks/use-permissions';
import { UserRole } from '@/types';
import { PageLoader } from '@/components/ui/spinner';
import { useAuthStore } from '@/store/auth.store';

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
 * @example
 * export default function UsersPage() {
 *   useRouteGuard({ permission: 'user:view' });
 *   return <UsersContent />;
 * }
 */
export function useRouteGuard(opts: RouteGuardOptions) {
  const { can, canAny, hasRole, hasAnyRole } = usePermissions();
  const { isAuthenticated, _hydrated } = useAuthStore();
  const router = useRouter();

  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (!_hydrated) return;
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    const o = optsRef.current;
    let allowed = true;
    if (o.permission    && !can(o.permission))           allowed = false;
    if (o.anyPermission && !canAny(...o.anyPermission))  allowed = false;
    if (o.role          && !hasRole(o.role))             allowed = false;
    if (o.anyRole       && !hasAnyRole(...o.anyRole))    allowed = false;

    if (!allowed) router.replace(o.redirectTo ?? '/dashboard');
  }, [isAuthenticated, _hydrated, can, canAny, hasRole, hasAnyRole, router]);
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
    const { can, canAny, hasRole, hasAnyRole } = usePermissions();
    const { isAuthenticated, isLoading, _hydrated } = useAuthStore();
    const router = useRouter();

    const optsRef = useRef(opts);
    optsRef.current = opts;

    useEffect(() => {
      if (!_hydrated || isLoading) return;
      if (!isAuthenticated) { router.replace('/auth/login'); return; }

      const o = optsRef.current;
      let allowed = true;
      if (o.permission    && !can(o.permission))           allowed = false;
      if (o.anyPermission && !canAny(...o.anyPermission))  allowed = false;
      if (o.role          && !hasRole(o.role))             allowed = false;
      if (o.anyRole       && !hasAnyRole(...o.anyRole))    allowed = false;

      if (!allowed) router.replace(o.redirectTo ?? '/dashboard');
    }, [isAuthenticated, isLoading, _hydrated, can, canAny, hasRole, hasAnyRole, router]);

    if (isLoading || !isAuthenticated) return <PageLoader />;

    return <Component {...props} />;
  };
}
