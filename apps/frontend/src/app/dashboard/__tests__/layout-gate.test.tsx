import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/* ══════════════════════════════════════════════════════════════════
   الأدوات: نتحكم في المسار والمستخدم والسلطة، ونمرّر child
   "مسبار" يسجّل كل عملية mount وكل جلب بيانات زائف.
   ══════════════════════════════════════════════════════════════════ */

let currentPath = '/dashboard';
const replace = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => currentPath,
  useRouter: () => ({ push, replace, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
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

/* مخزن صلاحيات حقيقي (zustand) حتى يعمل الاستدعاء بلا مُحدِّد
   في `usePermissions` وبمُحدِّد في `layout` — العقد الجديد قائم على status. */
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

/* مكونات بصرية/شبكية لا علاقة لها ببوابة الوصول */
vi.mock('@/components/shared/global-search', () => ({ GlobalSearch: () => null }));
vi.mock('@/components/ui/theme-switcher', () => ({ ThemeSwitcher: () => null }));
vi.mock('@/components/ui/theme-sync', () => ({ ThemeSync: () => null }));

import DashboardLayout from '@/app/dashboard/layout';
import { getRoutePolicy } from '@/lib/route-policy';
import { usePermissionsStore } from '@/store/permissions.store';

/* ── المسبار ──
   mountCount  يثبت عدم التركيب من الأساس
   fetches[]   يسجّل المسار الذي نُفّذت عنده عملية الجلب — وهذا هو المقياس
               الحاسم: صفحة مُركَّبة سابقًا لا "تعيد التركيب" عند تغيير
               pathname، لكنها تُعاد رسمها وتطلق effects جديدة، و act()
               يخفي الرسم العابر، فتسجيل الجلب حسب المسار هو الدليل. */
let mountCount = 0;
let fetchCount = 0;
const fetches: string[] = [];
function Probe({ name = 'PROBE' }: { name?: string }) {
  const path = usePathname();
  useEffect(() => {
    mountCount += 1;
    fetchCount += 1;
    fetches.push(path);
    return () => {};
  }, [path]);
  return <div data-testid="probe">{name}</div>;
}

const renderAt = (path: string) => {
  currentPath = path;
  return render(
    <DashboardLayout>
      <Probe />
    </DashboardLayout>,
  );
};

/** يمنح سلطة موثوقة للمستخدم الحالي — الحالة الوحيدة التي يُركَّب فيها children. */
const grantAuthority = (permissions: string[], role = 'receptionist', id = 'u1') => {
  usePermissionsStore.setState({
    permissions, status: 'ready', ownerId: id, ownerRole: role, error: null,
  });
};

beforeEach(() => {
  currentPath = '/dashboard';
  replace.mockClear();
  push.mockClear();
  mountCount = 0;
  fetchCount = 0;
  fetches.length = 0;
  authState.user.id = 'u1';
  authState.user.role = 'receptionist';
  authState.isAuthenticated = true;
  usePermissionsStore.setState({
    permissions: [], status: 'ready', ownerId: 'u1', ownerRole: 'receptionist', error: null,
  });
});

/* ══════════════════════════════════════════════════════════════════
   الدليل 1 — children لا يُركَّب إطلاقًا على مسار غير مسموح
   ══════════════════════════════════════════════════════════════════ */
describe('الدليل 1: children غير مُركَّب على مسار ممنوع', () => {
  it('لا يركّب child ولا يشغّل useEffect الخاص به على مسار محجوب بدور', async () => {
    authState.user.role = 'receptionist';
    grantAuthority([], 'receptionist');

    renderAt('/dashboard/admin/audit'); // anyRole: super_admin | center_manager

    expect(screen.queryByTestId('probe')).toBeNull();
    expect(mountCount).toBe(0);
    expect(fetchCount).toBe(0);
    expect(fetches).toEqual([]);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });

  it('لا يركّب child عندما يرد الـ API بلا الصلاحية المطلوبة', async () => {
    authState.user.role = 'receptionist';
    /* سلطة موثوقة، لكن قائمتها فارغة — لا صلاحية audit:view */
    grantAuthority([], 'receptionist');

    renderAt('/dashboard/audit');
    expect(screen.queryByTestId('probe')).toBeNull();
    expect(mountCount).toBe(0);
    expect(fetches).toEqual([]);
  });

  it('يوكّب child على مسار غير محمي (سلوك لم يتغيّر)', async () => {
    renderAt('/dashboard/notifications');
    await waitFor(() => expect(screen.getByTestId('probe')).toBeInTheDocument());
    expect(mountCount).toBe(1);
    expect(fetchCount).toBe(1);
    expect(fetches).toEqual(['/dashboard/notifications']);
    expect(replace).not.toHaveBeenCalled();
  });

  it('يوكّب child على مسار محمي مسموح (صلاحية من الـ API)', async () => {
    authState.user.role = 'receptionist';
    grantAuthority(['beneficiary:create'], 'receptionist');

    renderAt('/dashboard/beneficiaries/new'); // permission: beneficiary:create

    await waitFor(() => expect(screen.getByTestId('probe')).toBeInTheDocument());
    expect(mountCount).toBe(1);
    expect(fetches).toEqual(['/dashboard/beneficiaries/new']);
    expect(replace).not.toHaveBeenCalled();
  });

  it('deny-by-default: لا يُركَّب child أصلًا إذا لم يكن هناك مصادقة', async () => {
    authState.user.role = 'super_admin';
    grantAuthority(['user:view'], 'super_admin');
    authState.isAuthenticated = false;

    const { rerender } = renderAt('/dashboard/users'); // anyRole مسموح|super_admin
    expect(screen.queryByTestId('probe')).toBeNull();
    expect(mountCount).toBe(0);
    expect(fetches).toEqual([]);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/auth/login'));

    /* يبقى محجوبًا بعد التحويل، ولا يُركَّب عند إعادة الرسم */
    rerender(
      <DashboardLayout>
        <Probe />
      </DashboardLayout>,
    );
    expect(screen.queryByTestId('probe')).toBeNull();
    expect(mountCount).toBe(0);
  });
});

/* ══════════════════════════════════════════════════════════════════
   الدليل 2 — لا وراثة بين المسارات
   ══════════════════════════════════════════════════════════════════ */
describe('الدليل 2: لا وراثة صلاحيات بين المسارات', () => {
  it('ابنٌ محمي لا يرث منعَ الأب: الأب ممنوع والابن مسموح', async () => {
    authState.user.role = 'receptionist';
    grantAuthority(['session:create'], 'receptionist');

    /* الأب /dashboard/sessions يتطلب دورًا — ممنوع لـ receptionist */
    renderAt('/dashboard/sessions');
    expect(screen.queryByTestId('probe')).toBeNull();
    expect(mountCount).toBe(0);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });

  it('نفس المستخدم: الابن /sessions/new مسموح رغم أن الأب ممنوع', async () => {
    authState.user.role = 'receptionist';
    grantAuthority(['session:create'], 'receptionist');

    const { unmount } = renderAt('/dashboard/sessions');
    await waitFor(() => expect(replace).toHaveBeenCalled());
    unmount();
    replace.mockClear();

    renderAt('/dashboard/sessions/new'); // permission: session:create — لا علاقة له بـ anyRole الأب
    await waitFor(() => expect(screen.getByTestId('probe')).toBeInTheDocument());
    expect(mountCount).toBe(1);
    expect(replace).not.toHaveBeenCalled();
  });

  it('ابنٌ أعمق تحت مسار مسموح لا يرث سياسة الأب', () => {
    /* الأب مُدرج صراحة */
    expect(getRoutePolicy('/dashboard/admin/roles')).not.toBeNull();
    /* أعمق بمقدار segment إضافي: لا مطابقة ⇒ لا يرث سياسة الأب */
    expect(getRoutePolicy('/dashboard/admin/roles/x/y')).toBeNull();
    /* لكن النمط الديناميكي المُدرج صراحة يطابق */
    expect(getRoutePolicy('/dashboard/admin/roles/xyz')).not.toBeNull();
  });

  it('فشل آمن: مسار غير مُدرج = ممنوع لا مفتوح', async () => {
    /* الفجوة السابقة كانت fail-open. الآن layout يستخدم resolveRoutePolicy
       الذي يرفض أي مسار بلا سياسة مُدرجة. */
    expect(getRoutePolicy('/dashboard/beneficiaries')).not.toBeNull();
    renderAt('/dashboard/definitely-not-a-real-route');
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });

  it('لا تسريب بين قسم الإدارة وقسم المالية (accountant)', async () => {
    authState.user.role = 'accountant';
    grantAuthority(['payment:view', 'payment:create'], 'accountant');

    /* المالية مسموحة */
    const { unmount } = renderAt('/dashboard/payments');
    await waitFor(() => expect(screen.getByTestId('probe')).toBeInTheDocument());
    unmount();
    replace.mockClear();
    mountCount = 0;

    /* الإدارة ممنوعة —Sibling لا ترث إذن المالية */
    renderAt('/dashboard/admin/audit');
    expect(screen.queryByTestId('probe')).toBeNull();
    expect(mountCount).toBe(0);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });

  it('إذنُ مسار سابق لا يُورَّث للمسار التالي (allowedPath لا يتسرّب)', async () => {
    authState.user.role = 'receptionist';
    grantAuthority(['beneficiary:create'], 'receptionist');

    currentPath = '/dashboard/beneficiaries/new';
    const { rerender } = render(
      <DashboardLayout>
        <Probe />
      </DashboardLayout>,
    );
    await waitFor(() => expect(screen.getByTestId('probe')).toBeInTheDocument());
    const mountsBefore = mountCount;
    expect(mountsBefore).toBeGreaterThan(0);
    expect(fetches).toEqual(['/dashboard/beneficiaries/new']);
    expect(replace).not.toHaveBeenCalled();

    /* انتقال إلى مسار ممنوع: يجب أن يُحجب فورًا رغم أن المسار السابق كان مسموحًا */
    currentPath = '/dashboard/users'; // anyRole: super_admin | center_manager
    rerender(
      <DashboardLayout>
        <Probe />
      </DashboardLayout>,
    );

    expect(screen.queryByTestId('probe')).toBeNull();
    expect(mountCount).toBe(mountsBefore); // لا تركيب جديد إطلاقًا
    /* الأهم: لم تُنفَّذ أي عملية جلب على المسار الممنوع — لا رسم عابر ولا رسم كامل */
    expect(fetches).toEqual(['/dashboard/beneficiaries/new']);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });
});
