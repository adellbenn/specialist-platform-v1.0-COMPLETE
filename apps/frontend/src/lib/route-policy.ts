import type { UserRole } from '@/types';

export interface RoutePolicy {
  permission?: string;
  anyPermission?: string[];
  role?: UserRole;
  anyRole?: UserRole[];
  redirectTo?: string;
}

/**
 * سياسة الوصول لكل مسار داخل /dashboard — المصدر الوحيد لفرض الصلاحيات.
 *
 * تُقرأ من `src/app/dashboard/layout.tsx` قبل تركيب `children`، فأي صفحة غير
 * مسموح لها لا تُركَّب أصلاً ولا تُطلق طلبات API الخاصة بها (تسريب بيانات).
 *
 * `useRouteGuard` في الصفحة يبقى طبقة ثانية، لكن الاعتماد الحقيقي هنا.
 * القيم منقولة عن استدعاءات `useRouteGuard` القائمة في كل صفحة.
 */
const ALL_ROLES: UserRole[] = ['super_admin', 'center_manager', 'supervisor', 'specialist', 'receptionist', 'accountant'];
const STAFF: UserRole[] = ['super_admin', 'center_manager', 'supervisor', 'specialist', 'receptionist'];
const CLINICAL: UserRole[] = ['super_admin', 'center_manager', 'supervisor', 'specialist'];
const MANAGERS: UserRole[] = ['super_admin', 'center_manager'];
/** المستفيد — يرى لوحة المنصة على بياناته فقط (قراءة + ملفه الشخصي) */
const SELF: UserRole[] = ['beneficiary'];

const ROUTE_POLICIES: Record<string, RoutePolicy> = {
  /* ── الجذر: كل مستخدم مصادَق (بما فيه المستفيد) — غير ذلك يدخل في حلقة تحويل عند تسجيل الدخول ── */
  '/dashboard': { anyRole: [...ALL_ROLES, ...SELF], redirectTo: '/auth/login' },

  /* ── المستخدمون ── */
  '/dashboard/users': { anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' },
  '/dashboard/users/new': { anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' },
  '/dashboard/specialists': { anyRole: ['super_admin', 'center_manager', 'supervisor'], redirectTo: '/dashboard' },

  /* ── المستفيدون ── */
  '/dashboard/beneficiaries': { anyRole: STAFF, redirectTo: '/dashboard' },
  '/dashboard/beneficiaries/:id': { anyRole: STAFF, redirectTo: '/dashboard/beneficiaries' },
  '/dashboard/beneficiaries/new': { permission: 'beneficiary:create', redirectTo: '/dashboard/beneficiaries' },
  '/dashboard/beneficiaries/:id/edit': { permission: 'beneficiary:update', redirectTo: '/dashboard/beneficiaries' },

  /* ── المواعيد ── */
  '/dashboard/appointments': { anyRole: [...STAFF, ...SELF], redirectTo: '/dashboard' },
  '/dashboard/appointments/:id': { anyRole: [...STAFF, ...SELF], redirectTo: '/dashboard/appointments' },
  '/dashboard/appointments/new': { permission: 'appointment:create', redirectTo: '/dashboard/appointments' },

  /* ── الجلسات ── */
  '/dashboard/sessions': { anyRole: ['super_admin', 'center_manager', 'supervisor', 'specialist'], redirectTo: '/dashboard' },
  '/dashboard/sessions/new': { permission: 'session:create', redirectTo: '/dashboard/sessions' },
  '/dashboard/sessions/:id': { anyRole: ['super_admin', 'center_manager', 'supervisor', 'specialist'], redirectTo: '/dashboard' },

  /* ── التقارير ── */
  '/dashboard/reports': { anyRole: CLINICAL, redirectTo: '/dashboard' },
  '/dashboard/reports/:id': { anyRole: CLINICAL, redirectTo: '/dashboard/reports' },
  '/dashboard/reports/new': { permission: 'report:create', redirectTo: '/dashboard/reports' },
  '/dashboard/reports/:id/edit': { permission: 'report:update', redirectTo: '/dashboard/reports' },

  /* ── المالية (المحاسب مدرَج: يملك payment:* في use-permissions) ── */
  '/dashboard/payments': { anyRole: ['super_admin', 'center_manager', 'accountant'], redirectTo: '/dashboard' },
  '/dashboard/payments/packages': { anyRole: ['super_admin', 'center_manager', 'accountant'], redirectTo: '/dashboard' },
  '/dashboard/payments/new-invoice': { anyRole: ['super_admin', 'center_manager', 'accountant'], redirectTo: '/dashboard' },
  '/dashboard/payments/new-subscription': { anyRole: ['super_admin', 'center_manager', 'accountant'], redirectTo: '/dashboard' },
  '/dashboard/payments/invoices/:id': { anyRole: ['super_admin', 'center_manager', 'accountant'], redirectTo: '/dashboard' },

  /* ── الملفات / الملف الشخصي / التقارير العامة ── */
  '/dashboard/files': { anyRole: ['super_admin', 'center_manager', 'supervisor', 'specialist'], redirectTo: '/dashboard' },
  '/dashboard/audit': { anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' },
  '/dashboard/analytics': { anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' },
  '/dashboard/notifications': { anyRole: [...STAFF, ...SELF], redirectTo: '/dashboard' },
  '/dashboard/search': { anyRole: ALL_ROLES, redirectTo: '/dashboard' },
  '/dashboard/profile': {
    anyRole: ['super_admin', 'center_manager', 'supervisor', 'specialist', 'receptionist', 'accountant', 'beneficiary'],
    redirectTo: '/dashboard',
  },
  '/dashboard/settings': {
    anyRole: ['super_admin', 'center_manager', 'supervisor', 'specialist', 'receptionist'],
    redirectTo: '/dashboard',
  },

  /* ── تفضيلات شخصية: مرآة لأب /settings ── */
  '/dashboard/settings/appearance': { anyRole: STAFF, redirectTo: '/dashboard/settings' },
  '/dashboard/settings/language': { anyRole: STAFF, redirectTo: '/dashboard/settings' },
  '/dashboard/settings/notifications': { anyRole: STAFF, redirectTo: '/dashboard/settings' },
  '/dashboard/settings/calendar': { anyRole: STAFF, redirectTo: '/dashboard/settings' },

  /* ── إعدادات إدارة ── */
  '/dashboard/settings/team': { anyRole: MANAGERS, redirectTo: '/dashboard/settings' },
  '/dashboard/settings/security': { anyRole: MANAGERS, redirectTo: '/dashboard/settings' },
  '/dashboard/settings/audit': { anyRole: MANAGERS, redirectTo: '/dashboard/settings' },
  '/dashboard/settings/data': { anyRole: MANAGERS, redirectTo: '/dashboard/settings' },
  '/dashboard/settings/billing': { anyRole: MANAGERS, redirectTo: '/dashboard/settings' },
  '/dashboard/settings/integrations': { anyRole: MANAGERS, redirectTo: '/dashboard/settings' },

  /* ── الإدارة ── */
  '/dashboard/admin/users': { anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' },
  '/dashboard/admin/roles': { anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' },
  '/dashboard/admin/roles/:id': { anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' },
  '/dashboard/admin/groups': { anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' },
  '/dashboard/admin/permissions': { anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' },
  '/dashboard/admin/security': { anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' },
  '/dashboard/admin/audit': { anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' },
};

const isParam = (segment: string) => segment.startsWith(':');

/**
 * سياسة كل صفحة: لا شيء داخل /dashboard مفتوح افتراضياً.
 *
 * الفشل الآمن مقصود: أي صفحة لا تُدرج هنا تُعامل كممنوعة ويُعاد التوجيه،
 * بدل أن تُركَّب لأي مستخدم مصادَق. هذا يقلب الفجوة التي كشفها التدقيق
 * (19 صفحة بلا سياسة) إلى خطأ بناء يمسكه الاختبار بدل ثغرة وقت التشغيل.
 * مسار غير معروف تحت /dashboard لا يجب أن يُحمّل أصلاً.
 */
export const DEFAULT_DENY = {
  anyRole: [] as UserRole[],
  redirectTo: '/dashboard',
} as const;

/**
 * يطابق المسار على-segment على-segment، مع تفضيل النمط الأدق (أقل wildcards).
 * يُرجع null للمسارات غير المحمية (سلوكها كما هو).
 */
export function getRoutePolicy(pathname: string): RoutePolicy | null {
  const segments = pathname.split('/').filter(Boolean);
  let best: RoutePolicy | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const [pattern, policy] of Object.entries(ROUTE_POLICIES)) {
    const parts = pattern.split('/').filter(Boolean);
    if (parts.length !== segments.length) continue;

    let score = 0;
    let matches = true;
    for (let i = 0; i < parts.length; i += 1) {
      if (isParam(parts[i])) { score += 1; continue; }
      if (parts[i] !== segments[i]) { matches = false; break; }
    }

    if (matches && score < bestScore) { best = policy; bestScore = score; }
  }

  return best;
}

/**
 * سياسة التسوية المُستخدمة عند التركيب: لا تُرجع null أبداً.
 * كل مسار داخل /dashboard بلا سياسة مُدرجة يُمنع ويُعاد توجيهه.
 */
export function resolveRoutePolicy(pathname: string): RoutePolicy {
  return getRoutePolicy(pathname) ?? { ...DEFAULT_DENY };
}
