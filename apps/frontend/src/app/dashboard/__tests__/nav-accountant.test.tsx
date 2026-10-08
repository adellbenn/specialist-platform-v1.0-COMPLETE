import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';

let currentPath = '/dashboard';

const { replace, push, router } = vi.hoisted(() => {
  const replace = vi.fn();
  const push = vi.fn();
  return {
    replace,
    push,
    router: { push, replace, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() },
  };
});

vi.mock('next/navigation', () => ({
  usePathname: () => currentPath,
  useRouter: () => router,
}));

const authState: any = {
  user: { id: 'u1', firstName: 'محاسب', lastName: 'م', email: 'a@b.c', role: 'accountant' },
  isAuthenticated: true,
  isLoading: false,
  _hydrated: true,
  login: vi.fn(), logout: vi.fn(), refreshUser: vi.fn(), setUser: vi.fn(),
};
vi.mock('@/store/auth.store', () => ({ useAuthStore: () => authState }));

/* مخزن حقيقي (zustand) حتى يعمل بلا مُحدِّد في `usePermissions`
   وبمُحدِّد في `layout` — العقد قائم على `status` و`owner`. */
vi.mock('@/store/permissions.store', async () => {
  const { create } = await import('zustand');
  const useStore = create<any>()(() => ({
    permissions: [],
    status: 'idle',
    ownerId: null,
    ownerRole: null,
    error: null,
    requestId: 0,
    fetchPermissions: vi.fn(),
    clearPermissions: vi.fn(),
  }));
  return { usePermissionsStore: useStore };
});

vi.mock('@/components/shared/global-search', () => ({ GlobalSearch: () => null }));
vi.mock('@/components/ui/theme-switcher', () => ({ ThemeSwitcher: () => null }));
vi.mock('@/components/ui/theme-sync', () => ({ ThemeSync: () => null }));

import DashboardLayout from '@/app/dashboard/layout';
import { getRoutePolicy } from '@/lib/route-policy';
import { usePermissions } from '@/hooks/use-permissions';
import { usePermissionsStore } from '@/store/permissions.store';
import { renderHook } from '@testing-library/react';

/** يمنح سلطة الـ API للمستخدم الحالي — الحالة الوحيدة التي يُركَّب فيها children. */
const grantApiAuthority = (permissions: string[], role = 'accountant', id = 'u1') => {
  usePermissionsStore.setState({
    permissions, status: 'ready', ownerId: id, ownerRole: role, error: null,
  });
};

beforeEach(() => {
  currentPath = '/dashboard';
  replace.mockClear(); push.mockClear();
  authState.user.id = 'u1';
  authState.user.role = 'accountant';
  authState.isAuthenticated = true;
  usePermissionsStore.setState({
    permissions: [], status: 'ready', ownerId: 'u1', ownerRole: 'accountant', error: null,
  });
});

const renderShell = () =>
  render(<DashboardLayout>{null}</DashboardLayout>).container;

const hasLink = (c: HTMLElement, href: string) => !!c.querySelector(`a[href="${href}"]`);

describe('accountant: الوصول والتنقّل', () => {
  it('policy المالية تسمح بدور accountant لكل مساراتها', () => {
    for (const p of [
      '/dashboard/payments',
      '/dashboard/payments/packages',
      '/dashboard/payments/new-invoice',
      '/dashboard/payments/new-subscription',
      '/dashboard/payments/invoices/inv-1',
    ]) {
      expect(getRoutePolicy(p)?.anyRole, p).toContain('accountant');
    }
  });

  it('سياسات المسارات الأخرى لا تسمح بـ accountant', () => {
    for (const p of [
      '/dashboard/admin/users', '/dashboard/admin/roles', '/dashboard/admin/roles/1',
      '/dashboard/admin/groups', '/dashboard/admin/permissions', '/dashboard/admin/security',
      '/dashboard/admin/audit', '/dashboard/users', '/dashboard/users/new',
      '/dashboard/audit', '/dashboard/analytics', '/dashboard/settings',
      '/dashboard/specialists', '/dashboard/files',
    ]) {
      expect(getRoutePolicy(p)?.anyRole ?? [], p).not.toContain('accountant');
    }
  });

  it('التنقّل يعرض روابط المدفوعات والفواتير للمحاسب', async () => {
    grantApiAuthority(['payment:view', 'payment:create', 'payment:update']);
    const c = renderShell();
    await waitFor(() => expect(c.querySelector('nav')).not.toBeNull());

    expect(hasLink(c, '/dashboard/payments')).toBe(true);
    expect(hasLink(c, '/dashboard/payments/new-invoice')).toBe(true);
  });

  it('التنقّل لا يعرض有任何 رابط إداري للمحاسب', async () => {
    grantApiAuthority(['payment:view', 'payment:create', 'payment:update']);
    const c = renderShell();
    await waitFor(() => expect(c.querySelector('nav')).not.toBeNull());

    const hrefs = Array.from(c.querySelectorAll('nav a')).map((a) => a.getAttribute('href') ?? '');
    expect(hrefs).toContain('/dashboard/payments');
    for (const h of hrefs) {
      expect(h.startsWith('/dashboard/admin'), h).toBe(false);
      expect(h.startsWith('/dashboard/users'), h).toBe(false);
      expect(h.startsWith('/dashboard/audit'), h).toBe(false);
      expect(h.startsWith('/dashboard/settings'), h).toBe(false);
    }
  });

  it('إضافة accountant للقائمة المدمجة لا تمنحه صلاحيات API لم يطلبها', () => {
    /* نفس الدور، لكن الـ API رجّع أقل من كامل قائمة الدور */
    grantApiAuthority(['payment:view']);
    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasRole('accountant')).toBe(true);
    expect(result.current.hasAnyRole('super_admin', 'center_manager')).toBe(false);
    expect(result.current.can('payment:view')).toBe(true);
    /* هذه في القائمة المدمجة لـ accountant — لا تُمنح لأن الـ API لم يرسلها */
    expect(result.current.can('payment:create')).toBe(false);
    expect(result.current.can('payment:update')).toBe(false);
    expect(result.current.can('beneficiary:view_all')).toBe(false);
    expect(result.current.can('report:export')).toBe(false);
    expect(result.current.isSuperAdmin).toBe(false);
  });

  it('صلاحية واحدة في الـ API لا تفتح صفحات أخرى', () => {
    grantApiAuthority(['payment:view']);
    const { result } = renderHook(() => usePermissions());
    const allowedByApi = ['payment:view'];
    for (const p of ['user:view', 'user:create', 'tenant:manage', 'audit:view', 'report:approve', 'beneficiary:archive']) {
      expect(result.current.can(p), p).toBe(false);
    }
    expect(result.current.permissions).toEqual(allowedByApi);
  });

  it('تنقّل المحاسب قائم على الدور لا على صلاحيات الـ API (سلوك موثّق)', async () => {
    /* الـ API لم يرسل أي صلاحية مالية، ومع ذلك يظهر رابط المدفوعات.
       gating التنقّل = الدور. gating البيانات = الـ API + الخادم. */
    grantApiAuthority([]);
    const c = renderShell();
    await waitFor(() => expect(c.querySelector('nav')).not.toBeNull());
    expect(hasLink(c, '/dashboard/payments')).toBe(true);

    const { result } = renderHook(() => usePermissions());
    expect(result.current.can('payment:view')).toBe(false);
  });

  it('receptionist لا يرى المدفوعات، و super_admin يراها', async () => {
    authState.user.role = 'receptionist';
    grantApiAuthority([], 'receptionist');
    let c = renderShell();
    await waitFor(() => expect(c.querySelector('nav')).not.toBeNull());
    expect(hasLink(c, '/dashboard/payments')).toBe(false);
    expect(hasLink(c, '/dashboard/payments/new-invoice')).toBe(false);
    c.remove();

    authState.user.role = 'super_admin';
    grantApiAuthority([], 'super_admin');
    c = renderShell();
    await waitFor(() => expect(c.querySelector('nav')).not.toBeNull());
    expect(hasLink(c, '/dashboard/payments')).toBe(true);
    expect(hasLink(c, '/dashboard/admin/users')).toBe(true);
  });
});
