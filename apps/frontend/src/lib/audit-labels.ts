/**
 * تسميات سجل الأمان — مصدر واحد لكل الواجهة.
 *
 * تُخزَّن العمليات في قاعدة البيانات بمفاتيحها الإنجليزية (CREATE، UPDATE، …)،
 * وتُعرض بالعربية عبر `getAuditActionLabel`. أي عملية غير معروفة تُعرض كما هي.
 */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  LOGIN: 'تسجيل دخول',
  LOGOUT: 'تسجيل خروج',
  CREATE: 'إنشاء',
  UPDATE: 'تعديل',
  DELETE: 'حذف/أرشفة',
};

/**
 * يعيد التسمية العربية لعملية معروفة، وإلا يعيد النص كما هو
 * (مثل READ/EXPORT/APPROVE/SUBMIT) أو نصًا فارغًا عند غياب القيمة.
 */
export function getAuditActionLabel(action?: string | null): string {
  if (!action) return '';
  return AUDIT_ACTION_LABELS[action] ?? action;
}

export interface AuditActor {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

/**
 * يعيد اسم الفاعل (الاسم الأول + الأخير)، أو بريده الإلكتروني عند غياب الاسم،
 * أو 'النظام' عند غياب الفاعل كليًا.
 */
export function getActorLabel(user?: AuditActor | null): string {
  if (!user) return 'النظام';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.email || 'النظام';
}

/**
 * تسميات الكيانات — المفاتيح مُوحَّدة بصيغة صغيرة بلا رموز لتغطية اختلاف
 * حالة الأحرف بين وحدة الصلاحيات (Role) والمُعترِض العام (auth).
 */
const AUDIT_ENTITY_LABELS: Record<string, string> = {
  auth: 'مصادقة',
  role: 'دور',
  roles: 'دور',
  permission: 'صلاحية',
  permissions: 'صلاحية',
  permissiongroup: 'مجموعة صلاحيات',
  permissiongroups: 'مجموعة صلاحيات',
  userpermission: 'صلاحية مستخدم',
  userpermissions: 'صلاحية مستخدم',
  user: 'مستخدم',
  users: 'مستخدم',
  tenant: 'مركز',
  tenants: 'مركز',
  beneficiary: 'مستفيد',
  beneficiaries: 'مستفيد',
  appointment: 'موعد',
  appointments: 'موعد',
  session: 'جلسة',
  sessions: 'جلسة',
  report: 'تقرير',
  reports: 'تقرير',
  invoice: 'فاتورة',
  invoices: 'فاتورة',
  subscription: 'اشتراك',
  subscriptions: 'اشتراك',
};

/** يحوّل نوع الكيان إلى مفتاح موحَّد (حروف صغيرة بلا رموز). */
function normalizeEntityKey(entityType: string): string {
  return entityType.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * يعيد التسمية العربية لنوع كيان معروف، وإلا يعيد القيمة الأصلية كما هي
 * أو نصًا فارغًا عند غيابها.
 */
export function getAuditEntityLabel(entityType?: string | null): string {
  if (!entityType) return '';
  return AUDIT_ENTITY_LABELS[normalizeEntityKey(entityType)] ?? entityType;
}
