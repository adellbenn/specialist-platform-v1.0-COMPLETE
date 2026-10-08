import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * عطل الجذر الثاني: قيمة `auth-storage` التالفة (كتابة متقطّعة/امتلاء المساحة)
 * تجعل `JSON.parse` يرمي داخل سلسلة `hydrate()`، فيبتلعها zustand صامتًا قبل
 * أن تُطلق `onFinishHydration` أو تضبط `hasHydrated()`، فتبقى `_hydrated=false`
 * إلى الأبد. عندها يخرج أثر `dashboard/layout.tsx` قبل استدعاء
 * `fetchPermissions()` فتبقى `permissionStatus='idle'` و`routeBlocked=true`
 * = PageSkeleton لا نهائي (بلا بطاقة خطأ وبلا تحويل وبلا طلب شبكة).
 * كل حالة هنا تُعيد تحميل الوحدة نفسها كما يفعل المتصفّح عند فتح الصفحة.
 */

const loadStore = async () => {
  vi.resetModules();
  const mod = await import('@/store/auth.store');
  return mod.useAuthStore;
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('فشل استرجاع جلسة المصادقة من التخزين', () => {
  it('قيمة JSON تالفة: التوهد يكمل و _hydrated=true ولا تبقى القيمة التالفة', async () => {
    localStorage.setItem('auth-storage', '{"state":{"isAuthenticated":tr');

    const store = await loadStore();

    expect(store.persist.hasHydrated()).toBe(true);
    expect(store.getState()._hydrated).toBe(true);
    /* القيمة التالفة لم تعد مخزَّنة: ما يُقرأ الآن إمّا لا شيء أو قيمة صالحة */
    const raw = localStorage.getItem('auth-storage');
    if (raw !== null) {
      expect(raw).not.toBe('{"state":{"isAuthenticated":tr');
      expect(() => JSON.parse(raw)).not.toThrow();
    }
    /* بلا جلسة صالحة ⇒ الحالة الابتدائية التي يوجّهها البوابة إلى تسجيل الدخول */
    expect(store.getState().isAuthenticated).toBe(false);
    expect(store.getState().user).toBeNull();
  });

  it('قيمة تالفة على شكل JSON صالح لكن غير صالح البنية (null): التوهد يكمل', async () => {
    localStorage.setItem('auth-storage', 'null');

    const store = await loadStore();

    expect(store.persist.hasHydrated()).toBe(true);
    expect(store.getState()._hydrated).toBe(true);
    expect(store.getState().isAuthenticated).toBe(false);
  });

  it('تعذّر الوصول إلى localStorage أصلًا: التوهد يكمل ولا تبقى العلامة false', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    const store = await loadStore();

    expect(store.persist.hasHydrated()).toBe(true);
    expect(store.getState()._hydrated).toBe(true);
    expect(store.getState().isAuthenticated).toBe(false);
  });

  it('جلسة صالحة: الإصلاح لا يمسّ الاسترجاع ولا هوية المستخدم', async () => {
    const user = {
      id: 'u1',
      tenantId: 't1',
      avatarUrl: null,
      firstName: 'سالم',
      lastName: 'م',
      email: 's@m.c',
      role: 'super_admin',
    };
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 }),
    );

    const store = await loadStore();

    expect(store.persist.hasHydrated()).toBe(true);
    expect(store.getState()._hydrated).toBe(true);
    expect(store.getState().isAuthenticated).toBe(true);
    expect(store.getState().user).toEqual(user);

    /* وتُعاد الكتابة بالصيغة نفسها (state + version) حتى تبقى قديمة المتصفّحات صالحة */
    const written = JSON.parse(localStorage.getItem('auth-storage') as string);
    expect(written.version).toBe(0);
    expect(written.state.isAuthenticated).toBe(true);
  });
});
