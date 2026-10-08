import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/* ══════════════════════════════════════════════════════════════════
   الدليل 3 (Phase 2 / C) — لا mount قبل سلطة الـ API
   نتحكم في حالة المخزن يدويًا: لكل حالة نتحقق أن children لا يُركَّب
   إطلاقًا، وأن عمليات الجلب الخاصة به لا تُنفَّذ.
   ══════════════════════════════════════════════════════════════════ */

let currentPath = '/dashboard';

const { replace, push, router } = vi.hoisted(() => {
  const replace = vi.fn();
  const push = vi.fn();
  return {
    replace,
    push,
    /* `router` ثابت الهوية: `useRouter` في Next يعيد نفس المرجع دائمًا. لو أعاد
       كائنًا جديدًا كل render لأصبح `router` تبعية تتغيّر في كل رسم، فتُعاد
       تهيئة effect الجلب بلا سبب — تمثيل خاطئ لـ useEffect dependency. */
    router: { push, replace, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() },
  };
});

vi.mock('next/navigation', () => ({
  usePathname: () => currentPath,
  useRouter: () => router,
}));

const authState: any = {
  user: { id: 'u1', firstName: 'سالم', lastName: 'م', email: 's@m.c', role: 'receptionist' },
  isAuthenticated: true,
  isLoading: false,
  _hydrated: true,
  login: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
  setUser: vi.fn(),
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

let mountCount = 0;
const fetches: string[] = [];
function Probe() {
  const path = usePathname();
  useEffect(() => {
    mountCount += 1;
    fetches.push(path);
    return () => {};
  }, [path]);
  return <div data-testid="probe">PROBE</div>;
}

const renderAt = (path: string) => {
  currentPath = path;
  return render(
    <DashboardLayout>
      <Probe />
    </DashboardLayout>,
  );
};

beforeEach(() => {
  currentPath = '/dashboard';
  replace.mockClear();
  push.mockClear();
  mountCount = 0;
  fetches.length = 0;
  vi.useFakeTimers({ shouldAdvanceTime: true });
  authState.user.id = 'u1';
  authState.user.role = 'receptionist';
  authState.isAuthenticated = true;
  authState._hydrated = true;
  authState.refreshUser = vi.fn();
  usePermissionsStore.setState({
    permissions: [], status: 'idle', ownerId: null, ownerRole: null, error: null, requestId: 0,
    fetchPermissions: vi.fn(), clearPermissions: vi.fn(),
  });
});

afterEach(() => {
  vi.useRealTimers();
});

/* ══════════════════════════════════════════════════════════════════
   انتظار السلطة
   ══════════════════════════════════════════════════════════════════ */
describe('C-1: لا mount قبل وصول السلطة', () => {
  it.each(['idle', 'loading', 'revoked', 'error'] as const)(
    'status=%s: children لا يُركَّب على مسار غير محمي أصلًا',
    (status) => {
      /* حتى على مسار بلا سياسة، غياب السلطة يعني لا mount */
      usePermissionsStore.setState({ status, permissions: ['dashboard:view'], ownerId: 'u1', ownerRole: 'receptionist' });
      renderAt('/dashboard/notifications');

      expect(screen.queryByTestId('probe')).toBeNull();
      expect(mountCount).toBe(0);
      expect(fetches).toEqual([]);
    },
  );

  it('إعادة تحميل (hard reload): لا سلطة في الذاكرة ⇒ لا children', () => {
    /* الحالة الافتراضية بعد التحميل: idle بلا صلاحيات.
       أي Listen من التخزين المحلي كانت ستعطي صلاحيات المستخدم السابق. */
    usePermissionsStore.setState({ status: 'idle' });
    renderAt('/dashboard/beneficiaries/new');

    expect(screen.queryByTestId('probe')).toBeNull();
    expect(mountCount).toBe(0);
  });

  it('لا يتسرّب صلاحيات جاهزة لمالك آخر (تبديل الحساب)', () => {
    /* A جاهزة، لكن المستخدم المعروض الآن B */
    authState.user.id = 'B';
    authState.user.role = 'accountant';
    usePermissionsStore.setState({
      status: 'ready', ownerId: 'A', ownerRole: 'receptionist',
      permissions: ['user:create', 'tenant:manage'],
    });

    renderAt('/dashboard/notifications');
    expect(screen.queryByTestId('probe')).toBeNull();
    expect(mountCount).toBe(0);
  });

  it('لا يتسرّب صلاحيات جاهزة لدور مختلف (تغيّر الدور)', () => {
    /* نفس المعرّف، لكن الدور المعروض الآن تغيّر إلى super_admin
       بينما الصلاحيات ما زالت مملوكة لدور receptionist */
    authState.user.role = 'super_admin';
    usePermissionsStore.setState({
      status: 'ready', ownerId: 'u1', ownerRole: 'receptionist', permissions: ['dashboard:view'],
    });
    renderAt('/dashboard/notifications');
    expect(screen.queryByTestId('probe')).toBeNull();
    expect(mountCount).toBe(0);
  });

  it('لا يحوّل المسار إلى /dashboard أثناء الانتظار (لا قرار مبكر)', async () => {
    usePermissionsStore.setState({ status: 'loading' });
    renderAt('/dashboard/admin/audit'); // anyRole: super_admin | center_manager

    expect(screen.queryByTestId('probe')).toBeNull();
    /* القرار مؤجَّل، لا صفر-أخطاء مبكر يحوّل مستخدمًا لمكان آخر */
    expect(replace).not.toHaveBeenCalled();
    await waitFor(() => expect(push).not.toHaveBeenCalled());
  });

  it('الجلب يبدأ بهوية المستخدم الحالية (لا جلب بلا هوية)', () => {
    const fetchPermissions = vi.fn();
    usePermissionsStore.setState({ status: 'idle', fetchPermissions });

    renderAt('/dashboard');

    expect(fetchPermissions).toHaveBeenCalledWith({ id: 'u1', role: 'receptionist' });
  });

  it('تغيّر الدور يعيد الجلب للهوية الجديدة', () => {
    const fetchPermissions = vi.fn();
    usePermissionsStore.setState({ status: 'idle', fetchPermissions });

    const { rerender } = render(
      <DashboardLayout><Probe /></DashboardLayout>,
    );
    expect(fetchPermissions).toHaveBeenCalledWith({ id: 'u1', role: 'receptionist' });

    authState.user.role = 'super_admin';
    rerender(<DashboardLayout><Probe /></DashboardLayout>);

    expect(fetchPermissions).toHaveBeenLastCalledWith({ id: 'u1', role: 'super_admin' });
  });

  it('authority جاهزة: children تُركَّب (السلوك السليم لا يتغيّر)', async () => {
    usePermissionsStore.setState({
      status: 'ready', ownerId: 'u1', ownerRole: 'receptionist', permissions: ['beneficiary:create'],
    });
    renderAt('/dashboard/beneficiaries/new');

    await waitFor(() => expect(screen.getByTestId('probe')).toBeInTheDocument());
    expect(mountCount).toBe(1);
    expect(replace).not.toHaveBeenCalled();
  });
});

/* ══════════════════════════════════════════════════════════════════
   فشل الجلب
   ══════════════════════════════════════════════════════════════════ */
describe('C-2: فشل الجلب لا يمنح صلاحية', () => {
  it('error: children محجوبة', () => {
    usePermissionsStore.setState({ status: 'error', error: 'Network Error' });
    renderAt('/dashboard/notifications');
    expect(screen.queryByTestId('probe')).toBeNull();
    expect(mountCount).toBe(0);
  });

  it('error: لا حلقة إعادة تلقائية — رسالة فشل وزر إعادة صريح', async () => {
    const fetchPermissions = vi.fn();
    usePermissionsStore.setState({ status: 'error', error: 'Network Error', fetchPermissions });

    renderAt('/dashboard/notifications');
    expect(screen.queryByTestId('probe')).toBeNull();
    expect(screen.getByTestId('permission-error')).toBeInTheDocument();

    /* لا طلب تلقائي متكرر مهما طال الوقت — الفشل يظهر ولا يدور في حلقة.
       الجلب الأوّلي واحد، ومهما طال الوقت يبقى العدد عنده. */
    await act(async () => { await vi.advanceTimersByTimeAsync(600_000); });
    const callsBefore = fetchPermissions.mock.calls.length;
    expect(callsBefore).toBe(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(600_000); });
    expect(fetchPermissions.mock.calls.length).toBe(callsBefore);
    expect(fetches).toEqual([]);

    /* زر إعادة المحاولة يطلب للهوية نفسها */
    fireEvent.click(screen.getByText('إعادة المحاولة'));
    expect(fetchPermissions.mock.calls.length).toBe(callsBefore + 1);
    expect(fetchPermissions).toHaveBeenLastCalledWith({ id: 'u1', role: 'receptionist' });
    expect(screen.queryByTestId('probe')).toBeNull();
  });

  it('نجاح الجلب لاحقًا يزيل رسالة الفشل', async () => {
    usePermissionsStore.setState({ status: 'error', error: 'Network Error' });
    const { rerender } = renderAt('/dashboard/notifications');

    usePermissionsStore.setState({
      status: 'ready', ownerId: 'u1', ownerRole: 'receptionist', permissions: ['dashboard:view'],
    });
    rerender(
      <DashboardLayout>
        <Probe />
      </DashboardLayout>,
    );

    await waitFor(() => expect(screen.getByTestId('probe')).toBeInTheDocument());
    expect(screen.queryByTestId('permission-error')).toBeNull();
  });
});
