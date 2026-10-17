import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const replace = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push,
    replace,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const authState: any = {
  user: { id: 'u1', firstName: 'سالم', lastName: 'م', email: 'a@b.c', role: 'receptionist' },
  isAuthenticated: true,
  isLoading: false,
  _hydrated: true,
  mustChangePassword: false,
  login: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
  setUser: vi.fn(),
  clearMustChangePassword: vi.fn(),
};
vi.mock('@/store/auth.store', () => ({ useAuthStore: () => authState }));

vi.mock('@/store/permissions.store', async () => {
  const { create } = await import('zustand');
  const useStore = create<any>()(() => ({
    permissions: [],
    status: 'ready',
    ownerId: 'u1',
    ownerRole: 'receptionist',
    error: null,
    requestId: 0,
    fetchPermissions: vi.fn(),
    clearPermissions: vi.fn(),
  }));
  return { usePermissionsStore: useStore };
});

/* حاوية البحث تُعطى data-testid للتحقق من أن زر المظهر ليس بداخلها */
vi.mock('@/components/shared/global-search', () => ({
  GlobalSearch: () => <div data-testid="global-search" />,
}));
/* زر المظهر يُعطى data-testid للتحقق من موضعه ضمن أزرار الترويسة */
vi.mock('@/components/ui/theme-switcher', () => ({
  ThemeSwitcher: () => <button data-testid="theme-toggle">المظهر</button>,
}));
vi.mock('@/components/ui/theme-sync', () => ({ ThemeSync: () => null }));

import DashboardLayout from '@/app/dashboard/layout';

beforeEach(() => {
  replace.mockClear();
  push.mockClear();
  authState.mustChangePassword = false;
});

describe('dashboard layout: طبقات الترويسة ومكان زر المظهر', () => {
  it('زر المظهر داخل مجموعة أزرار الترويسة وليس داخل حاوية البحث', () => {
    render(
      <DashboardLayout>
        <div data-testid="child" />
      </DashboardLayout>,
    );

    const actions = screen.getByTestId('header-actions');
    const search = screen.getByTestId('global-search');
    const theme = screen.getByTestId('theme-toggle');

    expect(actions.contains(theme)).toBe(true);
    expect(search.contains(theme)).toBe(false);
  });

  it('قائمة المستخدم المنسدلة تحمل z-index أعلى من بطاقات المحتوى', async () => {
    render(
      <DashboardLayout>
        <div data-testid="child" />
      </DashboardLayout>,
    );

    fireEvent.click(await screen.findByText('سالم م'));

    const panel = await screen.findByTestId('user-menu-panel');
    expect(panel.className).toContain('z-50');
  });
});
