import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { User, AuthTokens } from '@/types';
import apiClient from '@/lib/api-client';
import { usePermissionsStore } from '@/store/permissions.store';

/* ─── تخزين الجلسة الآمن ───
   `createJSONStorage` الافتراضية تقرأ القيمة الخام وتنفّذ JSON.parse داخل سلسلة
   `hydrate()`، وأي استثناء يبتلعه `.catch` الأخير **دون إشارة**: لا يُطلق
   `onFinishHydration` ولا يضبط `hasHydrated()`. عندها تبقى `_hydrated=false`
   إلى الأبد، فيخرج `dashboard/layout.tsx` من أثره الأول (`if (!_hydrated) return`)
   دون استدعاء `fetchPermissions()` أبدًا: تبقى `permissionStatus='idle'`
   و`hasAuthority=false` و`routeBlocked=true` — أي PageSkeleton لا نهائي بلا بطاقة
   خطأ وبلا تحويل وبلا طلب شبكة واحد.
   نفس الانسداد يحدث إذا تعذّر الوصول إلى localStorage (قيمة `storage` غير معرّفة).
   المُطبَّع هنا: قراءة ترميزية تُلقى القيمة التالفة وتُمحى، وأي فشل يُرجِع null
   فتكمل إعادة التحميل إلى الحالة الابتدائية — ومنها التحويل إلى تسجيل الدخول. */
type PersistedAuth = { user: User | null; isAuthenticated: boolean };

const authPersistStorage: PersistStorage<PersistedAuth> = {
  getItem: (name) => {
    try {
      const raw = window.localStorage.getItem(name);
      if (raw === null) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed as { state: PersistedAuth; version: number };
    } catch {
      try { window.localStorage.removeItem(name); } catch { /* تخزين محجوب */ }
      return null;
    }
  },
  /* الكتابة تخصّ التخزين الدائم فقط: فشلها (امتلاء المساحة/وضع خاص) لا يُبطل
     الجلسة الحالية ولا يُخرج استثناءً من وسط دوال المخزن. */
  setItem: (name, value) => {
    try { window.localStorage.setItem(name, JSON.stringify(value)); } catch { /* تخزين محجوب */ }
  },
  removeItem: (name) => {
    try { window.localStorage.removeItem(name); } catch { /* تخزين محجوب */ }
  },
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hydrated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      _hydrated: false,

      login: async (email: string, password: string) => {
        /* أي سلطة صلاحيات من جلسة سابقة تُبطل قبل بناء هوية الجلسة الجديدة،
           حتى لا يرث المستخدم الجديد صلاحية المستخدم السابق ولو للحظة. */
        usePermissionsStore.getState().clearPermissions();
        set({ isLoading: true });
        try {
          const { data } = await apiClient.post<{ data: AuthTokens }>('/auth/login', {
            email,
            password,
          });

          const { accessToken, refreshToken, user } = data.data;

          // حفظ التوكنات في Cookies
          const secure = process.env.NODE_ENV === 'production';
          Cookies.set('accessToken', accessToken, { expires: 1, sameSite: 'lax', secure, path: '/' });
          Cookies.set('refreshToken', refreshToken, { expires: 7, sameSite: 'lax', secure, path: '/' });

          set({ user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        /* الإبطال مركزي هنا عمدًا: كل مسارات انتهاء الجلسة تمرّ من هذه
           الدالة (تسجيل يدوي، فشل /auth/me، فشل تجديد التوكن) فلا يعتمد
           الأمر على تذكّر أي مستدعٍ لـ clearPermissions. */
        usePermissionsStore.getState().clearPermissions();
        Cookies.remove('accessToken', { path: '/' });
        Cookies.remove('refreshToken', { path: '/' });
        set({ user: null, isAuthenticated: false });
        apiClient.post('/auth/logout').catch(() => {});
      },

      refreshUser: async () => {
        try {
          const { data } = await apiClient.get<{ data: User }>('/auth/me');
          set({ user: data.data, isAuthenticated: true });
        } catch {
          get().logout();
        }
      },

      setUser: (user: User) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      storage: authPersistStorage,
    },
  ),
);

/* ─── علامة اكتمال إعادة التحميل ───
   تُضبط هنا **بعد** اكتمال `create()`، وليس داخل `onRehydrateStorage`.
   داخل المُهيّئ كانت تشير إلى `useAuthStore` وهي ما زالت قيد البناء، فيحدث
   `ReferenceError: Cannot access 'useAuthStore' before initialization`.
   zustand يبتلع هذا الخطأ صامتًا داخل سلسلة `_toThenable` الخاصة بـ`hydrate()`
   قبل أن تُضبَط `hasHydrated()`، فتبقى `_hydrated=false` إلى الأبد.
   وحينها تخرج بوابة `dashboard/layout.tsx` مبكرًا (`if (!_hydrated) return`)
   دون أن تستدعي `fetchPermissions()` أبدًا، فتبقى `status='idle'` و`hasAuthority=false`
   و`routeBlocked=true` — وهو بالضبط ما يُبقي الصفحة على PageSkeleton إلى ما لا نهاية. */
const markAuthHydrated = () => {
  useAuthStore.setState({ _hydrated: true });
};

if (useAuthStore.persist?.hasHydrated()) {
  markAuthHydrated();
} else {
  useAuthStore.persist?.onFinishHydration(markAuthHydrated);
}
