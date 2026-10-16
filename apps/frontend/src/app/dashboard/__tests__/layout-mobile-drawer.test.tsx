import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

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

describe('dashboard layout: درج التنقّل للجوال', () => {
  it('يُفتح الدرج عند النقر على زر القائمة ويُغلق عند النقر على رابط', async () => {
    const { container } = render(
      <DashboardLayout>
        <div data-testid="child" />
      </DashboardLayout>,
    );

    /* انتظار التركيب (mounted) بعد التأثير */
    await screen.findByText('سالم م');

    /* الدرج مغلق مبدئيًا */
    expect(screen.queryByTestId('mobile-nav-drawer')).toBeNull();

    /* زر فتح درج الجوال (lg:hidden) في الشريط العلوي */
    const hamburger = container.querySelector('button[class*="lg:hidden"]') as HTMLElement;
    expect(hamburger).not.toBeNull();

    fireEvent.click(hamburger);

    /* الرابط يظهر الآن داخل الدرج */
    const drawer = await screen.findByTestId('mobile-nav-drawer');
    expect(within(drawer).getAllByText('المستفيدون').length).toBe(1);

    /* النقر على رابط داخل الدرج يغلق الدرج */
    fireEvent.click(within(drawer).getAllByText('المستفيدون')[0]);

    await waitFor(() => expect(screen.queryByTestId('mobile-nav-drawer')).toBeNull());
  });
});
