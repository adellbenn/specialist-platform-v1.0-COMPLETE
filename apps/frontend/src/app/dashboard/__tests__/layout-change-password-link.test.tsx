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

vi.mock('@/components/shared/global-search', () => ({ GlobalSearch: () => null }));
vi.mock('@/components/ui/theme-switcher', () => ({ ThemeSwitcher: () => null }));
vi.mock('@/components/ui/theme-sync', () => ({ ThemeSync: () => null }));

import DashboardLayout from '@/app/dashboard/layout';

beforeEach(() => {
  replace.mockClear();
  push.mockClear();
  authState.mustChangePassword = false;
});

describe('dashboard layout: قائمة المستخدم', () => {
  it('عنصر "تغيير كلمة المرور" يرتبط بصفحة /auth/change-password بدل رسالة "قريباً"', async () => {
    render(
      <DashboardLayout>
        <div data-testid="child" />
      </DashboardLayout>,
    );

    /* فتح قائمة المستخدم بالنقر على زر الملف الشخصي في الشريط العلوي */
    const toggle = await screen.findByText('سالم م');
    fireEvent.click(toggle);

    const link = await screen.findByRole('link', { name: 'تغيير كلمة المرور' });
    expect(link).toHaveAttribute('href', '/auth/change-password');
  });
});
