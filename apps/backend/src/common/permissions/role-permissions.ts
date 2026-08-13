import { Permission } from './permissions.enum';

/**
 * ═══════════════════════════════════════════════════════════════
 * ROLE PERMISSIONS MATRIX
 * مصفوفة الصلاحيات — كل دور وما يملكه
 *
 * لإضافة صلاحية لدور: أضف السطر هنا فقط
 * النظام يقرأ منها تلقائياً
 * ═══════════════════════════════════════════════════════════════
 */

export type RoleKey =
  | 'super_admin'
  | 'center_manager'
  | 'supervisor'
  | 'specialist'
  | 'receptionist'
  | 'accountant'
  | 'beneficiary';

/** الأدوار المعطّلة — لا يُسمح لها بأي صلاحية */
export const DISABLED_ROLES: Set<RoleKey> = new Set(['accountant']);

export const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  // ─────────────────────────────────────────────────────────────
  // SUPER ADMIN — كل شيء
  // ─────────────────────────────────────────────────────────────
  super_admin: Object.values(Permission),

  // ─────────────────────────────────────────────────────────────
  // CENTER MANAGER — إدارة المركز كاملاً (قراءة + تعديل)
  // ─────────────────────────────────────────────────────────────
  center_manager: [
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_STATS,
    Permission.DASHBOARD_PERFORMANCE,
    Permission.BENEFICIARY_VIEW_ALL,
    Permission.BENEFICIARY_CREATE,
    Permission.BENEFICIARY_UPDATE,
    Permission.BENEFICIARY_ARCHIVE,
    Permission.BENEFICIARY_ASSIGN,
    Permission.FILE_VIEW,
    Permission.FILE_UPDATE,
    Permission.APPOINTMENT_VIEW_ALL,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_UPDATE,
    Permission.APPOINTMENT_CANCEL,
    Permission.APPOINTMENT_CONFIRM,
    Permission.SESSION_VIEW_ALL,
    Permission.SESSION_CREATE,
    Permission.SESSION_UPDATE,
    Permission.SESSION_CONFIRM_ATTEND,
    Permission.REPORT_VIEW_ALL,
    Permission.REPORT_CREATE,
    Permission.REPORT_UPDATE,
    Permission.REPORT_APPROVE,
    Permission.REPORT_EXPORT,
    Permission.PAYMENT_VIEW,
    Permission.PAYMENT_CREATE,
    Permission.PAYMENT_UPDATE,
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DEACTIVATE,
    Permission.TENANT_VIEW,
    Permission.PROFILE_VIEW_SELF,
    Permission.PROFILE_UPDATE_SELF,
    Permission.NOTIFICATION_VIEW,
    Permission.AUDIT_VIEW,
    Permission.ROLE_VIEW,
    Permission.ROLE_CREATE,
    Permission.ROLE_UPDATE,
    Permission.ROLE_DELETE,
    Permission.ROLE_ASSIGN_PERMISSIONS,
    Permission.PERMISSION_VIEW,
    Permission.PERMISSION_MANAGE,
    Permission.GROUP_VIEW,
    Permission.GROUP_CREATE,
    Permission.GROUP_UPDATE,
    Permission.GROUP_DELETE,
    Permission.USER_OVERRIDE,
    Permission.USER_DELETE,
    Permission.ANALYTICS_VIEW,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_UPDATE,
  ],

  // ─────────────────────────────────────────────────────────────
  // SUPERVISOR (مشرف) — مراقبة + موافقة التقارير
  // ─────────────────────────────────────────────────────────────
  supervisor: [
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_STATS,
    Permission.DASHBOARD_PERFORMANCE,
    Permission.BENEFICIARY_VIEW_ALL,
    Permission.FILE_VIEW,
    Permission.APPOINTMENT_VIEW_ALL,
    Permission.SESSION_VIEW_ALL,
    Permission.REPORT_VIEW_ALL,
    Permission.REPORT_VIEW_OWN,
    Permission.REPORT_APPROVE,
    Permission.REPORT_EXPORT,
    Permission.PROFILE_VIEW_SELF,
    Permission.PROFILE_UPDATE_SELF,
    Permission.NOTIFICATION_VIEW,
  ],

  // ─────────────────────────────────────────────────────────────
  // MANAGER (مدير — المطلوب في هذه المرحلة)
  // قراءة فقط بدون أي تعديل
  // ─────────────────────────────────────────────────────────────
  // ملاحظة: center_manager يُعيَّن على مستوى tenant
  // supervisor يمثل دور "المدير — قراءة فقط" المطلوب

  // ─────────────────────────────────────────────────────────────
  // SPECIALIST (أخصائي) — المطلوب في هذه المرحلة
  // إدارة المتابعة الكاملة لحالاته فقط
  // ─────────────────────────────────────────────────────────────
  specialist: [
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_STATS,
    // المستفيدون — حالاته فقط
    Permission.BENEFICIARY_VIEW_OWN,
    Permission.BENEFICIARY_CREATE,
    Permission.BENEFICIARY_UPDATE,
    Permission.BENEFICIARY_ASSIGN,
    Permission.FILE_VIEW,
    Permission.FILE_UPDATE,
    // المواعيد — مواعيده فقط
    Permission.APPOINTMENT_VIEW_OWN,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_UPDATE,
    Permission.APPOINTMENT_CANCEL,
    Permission.APPOINTMENT_CONFIRM,
    // الجلسات
    Permission.SESSION_VIEW_OWN,
    Permission.SESSION_CREATE,
    Permission.SESSION_UPDATE,
    Permission.SESSION_CONFIRM_ATTEND,
    // التقارير — تقاريره فقط
    Permission.REPORT_VIEW_OWN,
    Permission.REPORT_CREATE,
    Permission.REPORT_UPDATE,
    // الملف الشخصي
    Permission.PROFILE_VIEW_SELF,
    Permission.PROFILE_UPDATE_SELF,
    Permission.NOTIFICATION_VIEW,
  ],

  // ─────────────────────────────────────────────────────────────
  // RECEPTIONIST (موظف الاستقبال)
  // ─────────────────────────────────────────────────────────────
  receptionist: [
    Permission.DASHBOARD_VIEW,
    Permission.BENEFICIARY_VIEW_ALL,
    Permission.BENEFICIARY_CREATE,
    Permission.BENEFICIARY_UPDATE,
    Permission.APPOINTMENT_VIEW_ALL,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_UPDATE,
    Permission.APPOINTMENT_CANCEL,
    Permission.APPOINTMENT_CONFIRM,
    Permission.PROFILE_VIEW_SELF,
    Permission.PROFILE_UPDATE_SELF,
    Permission.NOTIFICATION_VIEW,
  ],

  // ─────────────────────────────────────────────────────────────
  // ACCOUNTANT (محاسب)
  // ─────────────────────────────────────────────────────────────
  accountant: [
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_STATS,
    Permission.BENEFICIARY_VIEW_ALL,
    Permission.PAYMENT_VIEW,
    Permission.PAYMENT_CREATE,
    Permission.PAYMENT_UPDATE,
    Permission.REPORT_VIEW_ALL,
    Permission.REPORT_EXPORT,
    Permission.PROFILE_VIEW_SELF,
    Permission.PROFILE_UPDATE_SELF,
    Permission.NOTIFICATION_VIEW,
  ],

  // ─────────────────────────────────────────────────────────────
  // BENEFICIARY (مستفيد) — المطلوب في هذه المرحلة
  // يرى نفسه ومواعيده وتقاريره المشاركة فقط
  // ─────────────────────────────────────────────────────────────
  beneficiary: [
    Permission.BENEFICIARY_VIEW_SELF,
    Permission.FILE_VIEW_SELF,
    Permission.APPOINTMENT_VIEW_SELF,
    Permission.REPORT_VIEW_SHARED,
    Permission.PROFILE_VIEW_SELF,
    Permission.PROFILE_UPDATE_SELF,
    Permission.NOTIFICATION_VIEW,
  ],
};

/**
 * التحقق من امتلاك دور معين لصلاحية محددة
 */
export function roleHasPermission(role: RoleKey, permission: Permission): boolean {
  if (DISABLED_ROLES.has(role)) return false;
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

/**
 * جلب كل صلاحيات دور معين
 */
export function getPermissionsForRole(role: RoleKey): Permission[] {
  if (DISABLED_ROLES.has(role)) return [];
  return ROLE_PERMISSIONS[role] ?? [];
}
