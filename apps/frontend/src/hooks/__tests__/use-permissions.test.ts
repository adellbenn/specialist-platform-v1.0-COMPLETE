import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@/lib/api-client', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(() => Promise.resolve({ data: {} })),
    put:    vi.fn(() => Promise.resolve({ data: {} })),
    patch:  vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
  registerAuthFailureHandler: vi.fn(),
}));

import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { usePermissionsStore } from '@/store/permissions.store';
import { usePermissions } from '@/hooks/use-permissions';

const mockedGet = vi.mocked(apiClient.get);

const asUser = (role: string, id = 'u1') =>
  ({ id, email: 'a@b.c', firstName: 'A', lastName: 'B', role, isActive: true }) as any;

const owner = (role: string, id = 'u1') => ({ id, role });

/** يضع المخزن في حالة `ready` — أي «سلطة موثوقة» — بشكل مباشر. */
const readyAs = (role: string, permissions: string[], id = 'u1') => {
  useAuthStore.setState({ user: asUser(role, id), isAuthenticated: true, _hydrated: true });
  usePermissionsStore.setState({
    permissions, status: 'ready', ownerId: id, ownerRole: role, error: null,
  });
};

beforeEach(() => {
  mockedGet.mockReset();
  useAuthStore.setState({ user: asUser('receptionist'), isAuthenticated: true, _hydrated: true });
  usePermissionsStore.setState({
    permissions: [], status: 'idle', ownerId: null, ownerRole: null, error: null, requestId: 0,
  });
});

/* ══════════════════════════════════════════════════════════════════
   B/C — سلطة الـ API فقط، بلا قائمة احتياطية
   ══════════════════════════════════════════════════════════════════ */
describe('authority: ready فقط هي مصدر التفويض', () => {
  it('بعد جلب ناجح تصبح قائمة الـ API هي المرجع (بما فيها [])', async () => {
    useAuthStore.setState({ user: asUser('accountant') });
    mockedGet.mockResolvedValueOnce({ data: { data: ['payment:view'] } } as any);

    await act(async () => { await usePermissionsStore.getState().fetchPermissions(owner('accountant')); });

    expect(usePermissionsStore.getState().status).toBe('ready');
    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasAuthority).toBe(true);
    expect(result.current.permissions).toEqual(['payment:view']);
    expect(result.current.can('payment:view')).toBe(true);
  });

  it('قائمة API فارغة = ready لكن صفر صلاحيات (حارس التصعيد)', async () => {
    useAuthStore.setState({ user: asUser('receptionist') });
    mockedGet.mockResolvedValueOnce({ data: { data: [] } } as any);

    await act(async () => { await usePermissionsStore.getState().fetchPermissions(owner('receptionist')); });

    expect(usePermissionsStore.getState().status).toBe('ready');
    const { result } = renderHook(() => usePermissions());
    expect(result.current.permissions).toEqual([]);
    expect(result.current.can('beneficiary:create')).toBe(false);
    expect(result.current.can('dashboard:view')).toBe(false);
  });

  it('استجابة مفقودة data.data تفتح بابًا ولا تصعّد', async () => {
    useAuthStore.setState({ user: asUser('super_admin') });
    mockedGet.mockResolvedValueOnce({ data: {} } as any);

    await act(async () => { await usePermissionsStore.getState().fetchPermissions(owner('super_admin')); });

    expect(usePermissionsStore.getState().permissions).toEqual([]);
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can('user:create')).toBe(false);
    expect(result.current.can('tenant:manage')).toBe(false);
  });

  /* ── عكس السلوك القديم: لا قائمة احتياطية قبل الجلب ── */
  it('قبل الجلب (idle) لا صلاحية إطلاقًا — لا قائمة احتياطية', () => {
    useAuthStore.setState({ user: asUser('receptionist') });
    const { result } = renderHook(() => usePermissions());

    expect(usePermissionsStore.getState().status).toBe('idle');
    expect(result.current.hasAuthority).toBe(false);
    /* receptionist كان يحصل على هذه كاملة من القائمة المدمجة قبل الجلب */
    expect(result.current.can('beneficiary:create')).toBe(false);
    expect(result.current.can('appointment:create')).toBe(false);
    expect(result.current.can('dashboard:view')).toBe(false);
  });

  it('لا يتسرّب من دور المستخدم ما لم يطلبه الـ API (لا union)', async () => {
    useAuthStore.setState({ user: asUser('accountant') });
    mockedGet.mockResolvedValueOnce({ data: { data: ['payment:view'] } } as any);

    await act(async () => { await usePermissionsStore.getState().fetchPermissions(owner('accountant')); });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.can('payment:create')).toBe(false);
    expect(result.current.can('payment:update')).toBe(false);
    expect(result.current.can('report:export')).toBe(false);
  });

  it('كل حالة غير ready تمنع التفويض حتى لو كانت permissions ممتلئة', () => {
    for (const status of ['idle', 'loading', 'revoked', 'error'] as const) {
      usePermissionsStore.setState({
        permissions: ['user:create', 'tenant:manage'], status,
        ownerId: 'u1', ownerRole: 'receptionist', error: null,
      });
      const { result, unmount } = renderHook(() => usePermissions());
      expect(result.current.hasAuthority).toBe(false);
      expect(result.current.can('user:create')).toBe(false);
      expect(result.current.hasRole('receptionist')).toBe(false);
      unmount();
    }
  });
});

/* ══════════════════════════════════════════════════════════════════
   B — عزل الجلسات
   ══════════════════════════════════════════════════════════════════ */
describe('authority: عزل الجلسات', () => {
  it('تبديل الحساب: صلاحيات A لا تُستخدم لحساب B قبل جلب B', () => {
    readyAs('receptionist', ['beneficiary:create', 'user:create'], 'A');

    /* ينتقل التطبيق إلى حساب B، والجلب الجديد لم يصل بعد */
    useAuthStore.setState({ user: asUser('receptionist', 'B'), isAuthenticated: true });
    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasAuthority).toBe(false);
    expect(result.current.permissions).toEqual([]);
    expect(result.current.can('beneficiary:create')).toBe(false);
    expect(result.current.can('user:create')).toBe(false);
  });

  it('تغيّر الدور: يُلغى التفويض حتى يصل جلب الدور الجديد', () => {
    readyAs('receptionist', ['dashboard:view'], 'u1');
    const { result, rerender } = renderHook(() => usePermissions());
    expect(result.current.hasAuthority).toBe(true);

    /* الدور ترقّى إلى super_admin — الصيغة القديمة كانت ستسمح فورًا */
    act(() => { useAuthStore.setState({ user: asUser('super_admin', 'u1') }); });
    rerender();

    expect(result.current.hasAuthority).toBe(false);
    expect(result.current.can('dashboard:view')).toBe(false);
    expect(result.current.hasRole('super_admin')).toBe(false);
  });

  it('clearPermissions تبطل السلطة: hasRole وhasAnyRole يرجعان false', () => {
    readyAs('accountant', ['payment:view'], 'u1');
    act(() => { usePermissionsStore.getState().clearPermissions(); });

    const s = usePermissionsStore.getState();
    expect(s.status).toBe('revoked');
    expect(s.permissions).toEqual([]);
    expect(s.ownerId).toBeNull();

    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasAuthority).toBe(false);
    expect(result.current.can('payment:view')).toBe(false);
    /* هذا هو التغيير الجوهري: الأدوار تُقفل مع بقية أدوات التفويض */
    expect(result.current.hasRole('accountant')).toBe(false);
    expect(result.current.hasAnyRole('accountant', 'super_admin')).toBe(false);
  });

  it('استجابة متقادمة بعد logout تُسقط ولا تُعيد السلطة', async () => {
    let resolveFetch: (v: unknown) => void = () => {};
    mockedGet.mockImplementationOnce(() => new Promise((r) => { resolveFetch = r as any; }));

    const pending = usePermissionsStore.getState().fetchPermissions(owner('receptionist'));
    /* logout أثناء وجود الطلب في الطريق */
    act(() => { usePermissionsStore.getState().clearPermissions(); });

    await act(async () => {
      resolveFetch({ data: { data: ['user:create'] } });
      await pending;
    });

    const s = usePermissionsStore.getState();
    expect(s.status).toBe('revoked');
    expect(s.permissions).toEqual([]);

    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasAuthority).toBe(false);
    expect(result.current.can('user:create')).toBe(false);
  });

  it('استجابة متقادمة لمستخدم سابق تُسقط عند جلب أحدث', async () => {
    const deferred: Array<(v: unknown) => void> = [];
    mockedGet.mockImplementation(() => new Promise((r) => { deferred.push(r as any); }));

    const first = usePermissionsStore.getState().fetchPermissions(owner('receptionist', 'A'));
    const second = usePermissionsStore.getState().fetchPermissions(owner('accountant', 'B'));

    await act(async () => {
      /* B يرد أولًا، ثم A يرد متأخرًا */
      deferred[1]({ data: { data: ['payment:view'] } });
      await second;
      deferred[0]({ data: { data: ['user:create'] } });
      await first;
    });

    const s = usePermissionsStore.getState();
    expect(s.status).toBe('ready');
    expect(s.ownerId).toBe('B');
    expect(s.permissions).toEqual(['payment:view']);
  });

  it('لا انتظار مزدوج لنفس المالك (fetch واحد لكل هوية)', async () => {
    mockedGet.mockResolvedValue({ data: { data: ['dashboard:view'] } } as any);
    await act(async () => {
      await Promise.all([
        usePermissionsStore.getState().fetchPermissions(owner('receptionist')),
        usePermissionsStore.getState().fetchPermissions(owner('receptionist')),
      ]);
    });
    expect(mockedGet).toHaveBeenCalledTimes(1);
  });
  it('تسجيل الخروج في auth store يبطل السلطة مركزيًا', () => {
    readyAs('super_admin', ['user:create', 'tenant:manage'], 'u1');
    act(() => { useAuthStore.getState().logout(); });

    expect(usePermissionsStore.getState().status).toBe('revoked');
    expect(usePermissionsStore.getState().permissions).toEqual([]);

    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasAuthority).toBe(false);
  });

  it('تسجيل الدخول يبطل السلطة *قبل* إرسال طلب الدخول', async () => {
    /* A جاهزة بصلاحيات إدارية. B يسجّل دخولًا على نفس التبويب. */
    readyAs('super_admin', ['user:create', 'tenant:manage'], 'A');

    let statusWhenRequestSent: string | undefined;
    (apiClient.post as any).mockImplementationOnce(() => {
      /* نلتقط حالة المتجر لحظة إرسال الطلب: يجب أن تكون مُبطلة سلفًا، وإلا
         فإن المستخدم الجديد ورث صلاحية A طوال زمن استجابة /auth/login. */
      statusWhenRequestSent = usePermissionsStore.getState().status;
      return Promise.resolve({
        data: { data: { accessToken: 'a', refreshToken: 'r', user: asUser('receptionist', 'B') } },
      });
    });

    await act(async () => { await useAuthStore.getState().login('b@x.c', 'pw'); });

    expect(statusWhenRequestSent).toBe('revoked');

    useAuthStore.setState({ user: asUser('receptionist', 'B'), isAuthenticated: true });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasAuthority).toBe(false);
    expect(result.current.can('user:create')).toBe(false);
    expect(result.current.can('tenant:manage')).toBe(false);
  });

  it('تسجيل دخول B لا يعيد صلاحيات A إلى الذاكرة', async () => {
    readyAs('super_admin', ['user:create'], 'A');
    (apiClient.post as any).mockResolvedValueOnce({
      data: { data: { accessToken: 'a', refreshToken: 'r', user: asUser('accountant', 'B') } },
    });
    await act(async () => { await useAuthStore.getState().login('b@x.c', 'pw'); });

    expect(usePermissionsStore.getState().status).toBe('revoked');
    expect(usePermissionsStore.getState().permissions).toEqual([]);
    expect(usePermissionsStore.getState().ownerId).toBeNull();

    /* الآن يصل جلب B: Authority تخص B وحده */
    mockedGet.mockResolvedValueOnce({ data: { data: ['payment:view'] } } as any);
    await act(async () => { await usePermissionsStore.getState().fetchPermissions(owner('accountant', 'B')); });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasAuthority).toBe(true);
    expect(result.current.can('payment:view')).toBe(true);
    expect(result.current.can('user:create')).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════
   B — الفشل لا ينتج سلطة
   ══════════════════════════════════════════════════════════════════ */
describe('authority: فشل الجلب', () => {
  it('فشل من البداية: status=error وبلا صلاحية', async () => {
    mockedGet.mockRejectedValueOnce(new Error('500'));
    await act(async () => { await usePermissionsStore.getState().fetchPermissions(owner('receptionist')); });

    const s = usePermissionsStore.getState();
    expect(s.status).toBe('error');
    expect(s.error).toBeTruthy();
    expect(s.permissions).toEqual([]);

    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasAuthority).toBe(false);
    expect(result.current.can('beneficiary:create')).toBe(false);
  });

  it('فشل بعد نجاح سابق: لا تبقّى سلطة من القائمة القديمة', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: ['dashboard:view'] } } as any);
    await act(async () => { await usePermissionsStore.getState().fetchPermissions(owner('receptionist')); });
    expect(usePermissionsStore.getState().status).toBe('ready');

    mockedGet.mockRejectedValueOnce(new Error('Network Error'));
    await act(async () => { await usePermissionsStore.getState().fetchPermissions(owner('receptionist')); });

    const s = usePermissionsStore.getState();
    expect(s.status).toBe('error');
    expect(s.permissions).toEqual([]);

    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasAuthority).toBe(false);
    expect(result.current.can('dashboard:view')).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════
   B — لا وجود لسلطة قبل الجلب
   ══════════════════════════════════════════════════════════════════ */
describe('authority: لا مستخدم', () => {
  it('بدون مستخدم: كل الأدوات مرفوضة حتى لو كان المخزن ممتلئًا', () => {
    readyAs('super_admin', ['payment:view', 'user:create'], 'u1');
    useAuthStore.setState({ user: null, isAuthenticated: false });

    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasAuthority).toBe(false);
    expect(result.current.can('payment:view')).toBe(false);
    expect(result.current.can('user:create')).toBe(false);
    expect(result.current.hasRole('super_admin')).toBe(false);
    expect(result.current.hasAnyRole('super_admin', 'center_manager')).toBe(false);
    expect(result.current.permissions).toEqual([]);
  });

  it('إعادة التحميل: لا سلطة من localStorage', () => {
    /* الحالة القديمة كانت تُستعاد من `permissions-storage` عند التحميل */
    localStorage.setItem('permissions-storage', JSON.stringify({
      state: { permissions: ['user:create', 'tenant:manage'], status: 'ready' },
      version: 0,
    }));
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { user: asUser('super_admin'), isAuthenticated: true }, version: 0,
    }));

    /* قراءة من الذاكرة بعد «hard reload» */
    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasAuthority).toBe(false);
    expect(result.current.can('user:create')).toBe(false);
    expect(result.current.can('tenant:manage')).toBe(false);
  });

  it('المخزن لا يكتب أي شيء في التخزين المحلي بعد جلب ناجح', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    mockedGet.mockResolvedValueOnce({ data: { data: ['dashboard:view'] } } as any);

    await act(async () => { await usePermissionsStore.getState().fetchPermissions(owner('receptionist')); });

    const touched = setItem.mock.calls.map(([k]) => k);
    expect(touched).not.toContain('permissions-storage');
    setItem.mockRestore();
  });
});
