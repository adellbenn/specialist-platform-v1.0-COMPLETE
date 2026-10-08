import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/* ══════════════════════════════════════════════════════════════════
   بوابة /dashboard — تغطية انتقالات الحالة الفعلية.
   متاجر حقيقية (zustand) + layout حقيقي + كيبل API واحد يتحكم بالتوقيت.
   لا شيء هنا يفرض `_hydrated`: العلامة يجب أن تأتي من persist نفسه،
   وإلا لكان الاختبار يخفي عطلة `fetchPermissions` إلى الأبد.
   ══════════════════════════════════════════════════════════════════ */

let currentPath = '/dashboard/beneficiaries';

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

vi.mock('@/components/shared/global-search', () => ({ GlobalSearch: () => null }));
vi.mock('@/components/ui/theme-switcher', () => ({ ThemeSwitcher: () => null }));
vi.mock('@/components/ui/theme-sync', () => ({ ThemeSync: () => null }));

import DashboardLayout from '@/app/dashboard/layout';
import BeneficiariesPageClient from '@/app/dashboard/beneficiaries/page-client';
import { useAuthStore } from '@/store/auth.store';
import { usePermissionsStore } from '@/store/permissions.store';
import apiClient from '@/lib/api-client';
import type { User } from '@/types';

/* ── كيبل الشبكة ── */
type Mode = 'ok' | 'error' | 'hold';
const USER: User = {
  id: 'u1',
  tenantId: 't1',
  avatarUrl: null,
  firstName: 'سالم',
  lastName: 'م',
  email: 's@m.c',
  role: 'receptionist',
};
const PERMISSIONS = ['dashboard:view', 'beneficiary:view'];

let permissionsMode: Mode = 'ok';
let releasePermissions: (() => void) | null = null;
const apiLog: string[] = [];
let permissionsFetches = 0;

const ok = (config: any, body: any) => ({
  data: body,
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
  request: {},
});

apiClient.defaults.adapter = async (config: any) => {
  const url: string = config.url ?? '';
  apiLog.push(url);

  if (url.startsWith('/permissions/users/me')) {
    permissionsFetches += 1;
    if (permissionsMode === 'hold') {
      await new Promise<void>((resolve) => { releasePermissions = resolve; });
    }
    if (permissionsMode === 'error') {
      const err: any = new Error('Request failed with status code 500');
      err.isAxiosError = true;
      err.config = config;
      err.response = { status: 500, data: { message: 'boom' }, headers: {}, config, statusText: 'Internal Server Error' };
      throw err;
    }
    return ok(config, { data: PERMISSIONS });
  }
  if (url.startsWith('/auth/login')) {
    return ok(config, { data: { accessToken: 'a', refreshToken: 'r', user: USER } });
  }
  if (url.startsWith('/auth/me')) return ok(config, { data: USER });
  if (url.startsWith('/auth/logout')) return ok(config, { data: {} });
  if (url.startsWith('/beneficiaries/stats')) {
    return ok(config, { data: { total: 2, active: 1, completed: 1, inactive: 0, archived: 0 } });
  }
  if (url.startsWith('/beneficiaries')) {
    return ok(config, {
      data: [{
        id: 'b1',
        fileNumber: 'F-0001',
        firstName: 'أ',
        lastName: 'ب',
        caseType: 'psychological',
        status: 'active',
        intakeDate: '2026-01-15',
        assignedSpecialistId: null,
        notes: null,
      }],
      meta: { total: 1 },
    });
  }
  return ok(config, { data: {} });
};

/* ── المسبار ── */
let mountCount = 0;
function Probe() {
  useEffect(() => { mountCount += 1; }, []);
  return <div data-testid="probe">PROBE</div>;
}

const renderAt = (path: string, child: React.ReactNode = <Probe />) => {
  currentPath = path;
  return render(<DashboardLayout>{child}</DashboardLayout>);
};

beforeEach(() => {
  currentPath = '/dashboard/beneficiaries';
  replace.mockClear();
  push.mockClear();
  mountCount = 0;
  apiLog.length = 0;
  permissionsFetches = 0;
  permissionsMode = 'ok';
  releasePermissions = null;

  /* لا نلمس `_hydrated` عمدًا: قيمته يجب أن تنتج من hydrate() نفسه.
     لو عاد عطل TDZ في `onRehydrateStorage` لبقيت false ولم يُستدعَ fetchPermissions. */
  useAuthStore.setState({ user: { ...USER }, isAuthenticated: true, isLoading: false });
  usePermissionsStore.setState({
    permissions: [], status: 'idle', ownerId: null, ownerRole: null, error: null,
    requestId: usePermissionsStore.getState().requestId + 1,
  });
});

/* ══════════════════════════════════════════════════════════════════
   0 — hydration (الجذر): العلامة يجب أن تصل إلى true
   ══════════════════════════════════════════════════════════════════ */
describe('hydration المصادقة', () => {
  it('_hydrated يصل إلى true بعمل persist نفسه (لا يُفرض من الاختبار)', async () => {
    expect(useAuthStore.persist.hasHydrated()).toBe(true);
    expect(useAuthStore.getState()._hydrated).toBe(true);
    await act(async () => { await Promise.resolve(); });
    expect(useAuthStore.getState()._hydrated).toBe(true);
  });
});

/* ══════════════════════════════════════════════════════════════════
   1 — آلة الحالة
   ══════════════════════════════════════════════════════════════════ */
describe('آلة حالة التفويض على /dashboard/beneficiaries', () => {
  it('INITIAL/FETCH: idle ثم loading ⇒ لا children وskeleton ظاهر', async () => {
    permissionsMode = 'hold';
    renderAt('/dashboard/beneficiaries');

    await waitFor(() => expect(usePermissionsStore.getState().status).toBe('loading'));
    expect(screen.queryByTestId('probe')).toBeNull();
    expect(screen.getByTestId('page-skeleton')).toBeInTheDocument();
    expect(mountCount).toBe(0);

    await act(async () => { releasePermissions?.(); });
  });

  it('SUCCESS/AUTHORIZED: جلب ناجح ⇒ ready ثم children تُركَّب', async () => {
    renderAt('/dashboard/beneficiaries');

    await waitFor(() => expect(screen.getByTestId('probe')).toBeInTheDocument());
    expect(usePermissionsStore.getState().status).toBe('ready');
    expect(screen.queryByTestId('page-skeleton')).toBeNull();
    expect(mountCount).toBe(1);
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('ERROR: فشل الجلب ⇒ رسالة قابلة للتعافي، لا عظم لا نهائي', async () => {
    permissionsMode = 'error';
    renderAt('/dashboard/beneficiaries');

    await waitFor(() => expect(screen.getByTestId('permission-error')).toBeInTheDocument());
    expect(screen.queryByTestId('page-skeleton')).toBeNull();
    expect(screen.queryByTestId('probe')).toBeNull();
    expect(mountCount).toBe(0);
    expect(usePermissionsStore.getState().status).toBe('error');
  });

  it('REVOKED: إبطال ⇒ رسالة قابلة للتعافي، لا عظم لا نهائي', async () => {
    renderAt('/dashboard/beneficiaries');
    await waitFor(() => expect(screen.getByTestId('probe')).toBeInTheDocument());

    act(() => { usePermissionsStore.getState().clearPermissions(); });

    expect(usePermissionsStore.getState().status).toBe('revoked');
    expect(screen.queryByTestId('probe')).toBeNull();
    expect(screen.queryByTestId('page-skeleton')).toBeNull();
    expect(screen.getByTestId('permission-error')).toBeInTheDocument();
    expect(mountCount).toBe(1);
  });

  it('LOGOUT: يُبطل السلطة ولا يترك صلاحية بعد الخروج', async () => {
    renderAt('/dashboard/beneficiaries');
    await waitFor(() => expect(screen.getByTestId('probe')).toBeInTheDocument());

    act(() => { useAuthStore.getState().logout(); });

    expect(usePermissionsStore.getState().status).toBe('revoked');
    expect(usePermissionsStore.getState().permissions).toEqual([]);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(screen.queryByTestId('probe')).toBeNull();
  });

  it('LOGIN بعد LOGOUT: لا وراثة لسلطة الجلسة السابقة', async () => {
    renderAt('/dashboard/beneficiaries');
    await waitFor(() => expect(screen.getByTestId('probe')).toBeInTheDocument());

    act(() => { useAuthStore.getState().logout(); });
    expect(usePermissionsStore.getState().status).toBe('revoked');

    const before = permissionsFetches;
    await act(async () => { await useAuthStore.getState().login('s@m.c', 'pw'); });

    await waitFor(() => expect(screen.getByTestId('probe')).toBeInTheDocument());
    expect(usePermissionsStore.getState().status).toBe('ready');
    expect(usePermissionsStore.getState().ownerId).toBe('u1');
    expect(permissionsFetches).toBeGreaterThan(before);
  });

  it('RELOAD: لا سلطة متبقّية في المتصفح — المخزن بلا persist', () => {
    expect((usePermissionsStore as any).persist).toBeUndefined();
    expect(Object.keys(localStorage).filter((k) => k.includes('permission'))).toEqual([]);
  });

  it('قبل وصول الجلب: لا children مهما طال الانتظار', async () => {
    permissionsMode = 'hold';
    renderAt('/dashboard/beneficiaries');
    await waitFor(() => expect(usePermissionsStore.getState().status).toBe('loading'));
    expect(screen.queryByTestId('probe')).toBeNull();
    expect(screen.getByTestId('page-skeleton')).toBeInTheDocument();
    await act(async () => { releasePermissions?.(); });
  });
});

/* ══════════════════════════════════════════════════════════════════
   2 — ثبات الاستدعاءات (لا حلقة، لا إبطال فوري)
   ══════════════════════════════════════════════════════════════════ */
describe('ثبات الاستدعاءات', () => {
  it('جلب الصلاحيات يُستدعى مرة واحدة ولا يُعاد بعد الجاهزية', async () => {
    renderAt('/dashboard/beneficiaries');
    await waitFor(() => expect(screen.getByTestId('probe')).toBeInTheDocument());

    expect(permissionsFetches).toBe(1);

    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await act(async () => { await Promise.resolve(); });
    }
    expect(permissionsFetches).toBe(1);
    expect(usePermissionsStore.getState().status).toBe('ready');
    expect(screen.getByTestId('probe')).toBeInTheDocument();
    expect(screen.queryByTestId('permission-error')).toBeNull();
  });

  it('لا إبطال لاحق للسلطة بعد النجاح (لا clearPermissions متأخر)', async () => {
    const transitions: string[] = [];
    const unsub = usePermissionsStore.subscribe((s) => transitions.push(s.status));

    renderAt('/dashboard/beneficiaries');
    await waitFor(() => expect(screen.getByTestId('probe')).toBeInTheDocument());

    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await act(async () => { await Promise.resolve(); });
    }
    unsub();

    expect(transitions).toContain('ready');
    expect(transitions.filter((t) => t === 'idle' || t === 'revoked')).toEqual([]);
    expect(usePermissionsStore.getState().status).toBe('ready');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(push).not.toHaveBeenCalledWith('/auth/login');
  });
});

/* ══════════════════════════════════════════════════════════════════
   3 — تركيب صفحة beneficiaries الفعلية + طلب بياناتها
   ══════════════════════════════════════════════════════════════════ */
describe('صفحة beneficiaries', () => {
  const renderPage = async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = renderAt(
      '/dashboard/beneficiaries',
      <QueryClientProvider client={client}>
        <BeneficiariesPageClient />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(usePermissionsStore.getState().status).toBe('ready'));
    return view;
  };

  it('الطفل يُركَّب بعد منح السلطة', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getAllByRole('heading', { level: 1, name: 'المستفيدون' }).length).toBeGreaterThan(0);
    });
    expect(screen.queryByTestId('page-skeleton')).toBeNull();
  });

  it('طلب /beneficiaries يُطلق بعد تركيب الطفل ويُظهر البيانات', async () => {
    await renderPage();
    await waitFor(() => expect(apiLog.some((u) => u.startsWith('/beneficiaries'))).toBe(true));
    await waitFor(() => expect(screen.queryByTestId('list-skeleton')).toBeNull());
    expect(apiLog).toContain('/permissions/users/me');
  });

  it('بلا سلطة لا يُركَّب الطفل ولا يُطلق طلبات بياناته', async () => {
    permissionsMode = 'hold';
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderAt(
      '/dashboard/beneficiaries',
      <QueryClientProvider client={client}>
        <BeneficiariesPageClient />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(usePermissionsStore.getState().status).toBe('loading'));

    expect(screen.queryByTestId('page-skeleton')).toBeInTheDocument();
    expect(apiLog.some((u) => u.startsWith('/beneficiaries'))).toBe(false);

    await act(async () => { releasePermissions?.(); });
  });
});

/* ══════════════════════════════════════════════════════════════════
   4 — زر إعادة المحاولة في حالة الفشل
   ══════════════════════════════════════════════════════════════════ */
describe('التعافي من الفشل', () => {
  it('زر إعادة المحاولة يعيد الجلب ثم يركّب children', async () => {
    permissionsMode = 'error';
    renderAt('/dashboard/beneficiaries');
    await waitFor(() => expect(screen.getByTestId('permission-error')).toBeInTheDocument());
    expect(screen.queryByTestId('page-skeleton')).toBeNull();

    permissionsMode = 'ok';
    fireEvent.click(screen.getByText('إعادة المحاولة'));

    await waitFor(() => expect(screen.getByTestId('probe')).toBeInTheDocument());
    expect(screen.queryByTestId('permission-error')).toBeNull();
  });
});
