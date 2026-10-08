import { create } from 'zustand';
import apiClient, { registerAuthFailureHandler } from '@/lib/api-client';

/**
 * حالة سلطة الصلاحيات.
 *
 * `ready` هي الحالة الوحيدة التي تنتج قرار تفويض. كل حالة أخرى — بما فيها
 * `error` و`revoked` — هي رفض افتراضي (deny-by-default).
 */
export type PermissionStatus =
  | 'idle'      // لم يبدأ أي جلب — لا سلطة
  | 'loading'   // جلب جارٍ — لا قرار بعد
  | 'ready'     //سلطة موثوقة من الـ API — فقط هنا يُتخذ قرار
  | 'revoked'   // أُبطلت عمدًا (logout / clearPermissions) — لا سلطة
  | 'error';    // فشل الجلب — لا سلطة (لا آخر قائمة ناجمة)

export interface PermissionOwner {
  id: string;
  role: string;
}

interface PermissionsState {
  permissions: string[];
  status: PermissionStatus;
  /** هوية صاحب الصلاحية الحالية — لا تُستخدم إلا لمطابقة `user` عند القراءة */
  ownerId: string | null;
  ownerRole: string | null;
  error: string | null;
  /** جيل الطلب: يُستخدم إسقاط الاستجابات المتقادمة بعد logout أو جلب أحدث */
  requestId: number;

  fetchPermissions: (owner: PermissionOwner) => Promise<void>;
  /** إبطال السلطة — لا "العودة إلى الافتراضي" */
  clearPermissions: () => void;
}

export const usePermissionsStore = create<PermissionsState>()((set, get) => ({
  permissions: [],
  status: 'idle',
  ownerId: null,
  ownerRole: null,
  error: null,
  requestId: 0,

  fetchPermissions: async (owner) => {
    /* جلب جارٍ لنفس المالك: لا نضاعف الطلب */
    const current = get();
    if (current.status === 'loading' && current.ownerId === owner.id && current.ownerRole === owner.role) {
      return;
    }

    const requestId = current.requestId + 1;
    set({
      requestId,
      status: 'loading',
      ownerId: owner.id,
      ownerRole: owner.role,
      error: null,
    });

    try {
      const { data } = await apiClient.get<{ data: string[] }>('/permissions/users/me');
      /* استجابة متقادمة: حدث logout أو جلب أحدث بين الطلب والاستجابة */
      if (get().requestId !== requestId) return;
      set({ permissions: data?.data ?? [], status: 'ready', error: null });
    } catch (e) {
      if (get().requestId !== requestId) return;
      /* لا نحتفظ بآخر قائمة ناجمة: الفشل = لا سلطة، لا رجوع إلى حالة متساهلة */
      set({
        permissions: [],
        status: 'error',
        error: e instanceof Error ? e.message : 'fetch_failed',
      });
    }
  },

  clearPermissions: () => {
    /* إبطال السلطة + إسقاط أي استجابة جلب جارية عبر توليد جيل جديد */
    set((s) => ({
      requestId: s.requestId + 1,
      permissions: [],
      status: 'revoked',
      ownerId: null,
      ownerRole: null,
      error: null,
    }));
  },
}));

/**
 * لا يُحفظ أي شيء في localStorage.
 *
 * كان `persist` يحفظ `{ permissions, loaded: true }`، فينجو من إعادة التحميل
 * ويمنح المستخدم التالي سلطة المستخدم السابق قبل وصول أول جلب. السلطة يجب أن
 * تأتي من الخادم في كل جلسة، وهذا هو الحاجز الذي يضمن ذلك.
 */

registerAuthFailureHandler(() => {
  usePermissionsStore.getState().clearPermissions();
});
