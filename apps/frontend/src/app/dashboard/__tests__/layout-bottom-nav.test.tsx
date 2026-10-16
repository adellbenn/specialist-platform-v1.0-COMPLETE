import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

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
  user: { id: 'u1', firstName: 'سالم', lastName: 'م', email: 'a@b.c', role: 'receptionist' },
  isAuthenticated: true,
  isLoading: false,
  _hydrated: true,
  mustChangePassword: false,
  login: vi.fn(), logout: vi.fn(), refreshUser: vi.fn(), setUser: vi.fn(), clearMustChangePassword: vi.fn(),
};
vi.mock('@/store/auth.store', () => ({ useAuthStore: () => authState }));

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
import { usePermissionsStore } from '@/store/permissions.store';
import { isBottomNavHidden } from '@/lib/bottom-nav';

const grantApiAuthority = (permissions: string[], role = 'receptionist', id = 'u1') => {
  usePermissionsStore.setState({
    permissions, status: 'ready', ownerId: id, ownerRole: role, error: null,
  });
};

const renderShell = () =>
  render(
    <DashboardLayout>
      <div data-testid="child" />
    </DashboardLayout>,
  );

const bottomNavHrefs = (nav: HTMLElement) =>
  Array.from(nav.querySelectorAll('a')).map((a) => a.getAttribute('href') ?? '');

beforeEach(() => {
  currentPath = '/dashboard';
  replace.mockClear();
  push.mockClear();
  authState.user.id = 'u1';
  authState.user.role = 'receptionist';
  authState.isAuthenticated = true;
  grantApiAuthority([], 'receptionist');
});

describe('isBottomNavHidden', () => {
  it('يُخفي الشريط على صفحات المصادقة', () => {
    expect(isBottomNavHidden('/auth/login')).toBe(true);
    expect(isBottomNavHidden('/auth/change-password')).toBe(true);
  });

  it('يُظهر الشريط داخل لوحة التحكم', () => {
    expect(isBottomNavHidden('/dashboard')).toBe(false);
    expect(isBottomNavHidden('/dashboard/appointments')).toBe(false);
  });
});

describe('شريط التنقّل السفلي للجوال', () => {
  it('يعرض أول 4 مسارات مسموحة لدور receptionist ولا يزيد', async () => {
    const { container } = renderShell();
    const nav = await screen.findByTestId('mobile-bottom-nav');

    /* الدور يملك 6 مسارات في القائمة؛ الشريط يعرض أول 4 فقط */
    const expected = [
      '/dashboard',
      '/dashboard/search',
      '/dashboard/beneficiaries',
      '/dashboard/appointments',
    ];
    expect(bottomNavHrefs(nav)).toEqual(expected);

    /* العنصر الخامس هو «المزيد» وليس رابطًا */
    expect(within(nav).getByText('المزيد')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-testid="mobile-bottom-nav"] a').length).toBe(4);
  });

  it('لا يعرض أي مسار ممنوع على receptionist', async () => {
    renderShell();
    const nav = await screen.findByTestId('mobile-bottom-nav');
    for (const href of bottomNavHrefs(nav)) {
      expect(href.startsWith('/dashboard/admin'), href).toBe(false);
      expect(href.startsWith('/dashboard/users'), href).toBe(false);
      expect(href.startsWith('/dashboard/audit'), href).toBe(false);
      expect(href.startsWith('/dashboard/payments'), href).toBe(false);
    }
  });

  it('يعرض للمحاسب روابطه المالية فقط', async () => {
    authState.user.role = 'accountant';
    grantApiAuthority([], 'accountant');
    renderShell();
    const nav = await screen.findByTestId('mobile-bottom-nav');
    expect(bottomNavHrefs(nav)).toEqual(['/dashboard/payments', '/dashboard/payments/new-invoice']);
  });

  it('«المزيد» يفتح درج التنقّل القائم', async () => {
    renderShell();
    const nav = await screen.findByTestId('mobile-bottom-nav');
    expect(screen.queryByTestId('mobile-nav-drawer')).toBeNull();

    fireEvent.click(within(nav).getByText('المزيد'));
    expect(await screen.findByTestId('mobile-nav-drawer')).toBeInTheDocument();
  });
});
