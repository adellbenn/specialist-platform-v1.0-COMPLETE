/**
 * ═══════════════════════════════════════════════════════════════
 * PERMISSIONS REGISTRY
 * المرجع المركزي الوحيد لجميع صلاحيات النظام
 *
 * القاعدة: resource:action
 * أي صلاحية جديدة تُضاف هنا فقط — ثم تُوزَّع على الأدوار
 * ═══════════════════════════════════════════════════════════════
 */

export enum Permission {
  // ─── Dashboard ────────────────────────────────────────────
  DASHBOARD_VIEW = 'dashboard:view',
  DASHBOARD_STATS = 'dashboard:stats',
  DASHBOARD_PERFORMANCE = 'dashboard:performance',

  // ─── Beneficiaries ────────────────────────────────────────
  BENEFICIARY_VIEW_ALL = 'beneficiary:view_all', // مشاهدة جميع المستفيدين
  BENEFICIARY_VIEW_OWN = 'beneficiary:view_own', // مشاهدة حالاته فقط
  BENEFICIARY_VIEW_SELF = 'beneficiary:view_self', // المستفيد يرى نفسه فقط
  BENEFICIARY_CREATE = 'beneficiary:create',
  BENEFICIARY_UPDATE = 'beneficiary:update',
  BENEFICIARY_ARCHIVE = 'beneficiary:archive',
  BENEFICIARY_ASSIGN = 'beneficiary:assign',

  // ─── Beneficiary File (الملف الطبي/التربوي) ───────────────
  FILE_VIEW = 'file:view',
  FILE_VIEW_SELF = 'file:view_self', // المستفيد يرى ملفه
  FILE_UPDATE = 'file:update',

  // ─── Appointments (المواعيد) ──────────────────────────────
  APPOINTMENT_VIEW_ALL = 'appointment:view_all',
  APPOINTMENT_VIEW_OWN = 'appointment:view_own', // الأخصائي: مواعيده
  APPOINTMENT_VIEW_SELF = 'appointment:view_self', // المستفيد: مواعيده
  APPOINTMENT_CREATE = 'appointment:create',
  APPOINTMENT_UPDATE = 'appointment:update',
  APPOINTMENT_CANCEL = 'appointment:cancel',
  APPOINTMENT_CONFIRM = 'appointment:confirm',

  // ─── Sessions (الجلسات) ───────────────────────────────────
  SESSION_VIEW_ALL = 'session:view_all',
  SESSION_VIEW_OWN = 'session:view_own',
  SESSION_CREATE = 'session:create',
  SESSION_UPDATE = 'session:update',
  SESSION_CONFIRM_ATTEND = 'session:confirm_attendance',

  // ─── Reports (التقارير) ───────────────────────────────────
  REPORT_VIEW_ALL = 'report:view_all',
  REPORT_VIEW_OWN = 'report:view_own',
  REPORT_VIEW_SHARED = 'report:view_shared', // المستفيد يرى ما شُورك معه
  REPORT_CREATE = 'report:create',
  REPORT_UPDATE = 'report:update',
  REPORT_APPROVE = 'report:approve',
  REPORT_EXPORT = 'report:export',

  // ─── Payments (المدفوعات) ─────────────────────────────────
  PAYMENT_VIEW = 'payment:view',
  PAYMENT_CREATE = 'payment:create',
  PAYMENT_UPDATE = 'payment:update',

  // ─── Users (المستخدمون) ───────────────────────────────────
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_DEACTIVATE = 'user:deactivate',

  // ─── Tenants (المراكز) ────────────────────────────────────
  TENANT_VIEW = 'tenant:view',
  TENANT_MANAGE = 'tenant:manage',

  // ─── Profile (الملف الشخصي) ───────────────────────────────
  PROFILE_VIEW_SELF = 'profile:view_self',
  PROFILE_UPDATE_SELF = 'profile:update_self',

  // ─── Notifications ────────────────────────────────────────
  NOTIFICATION_VIEW = 'notification:view',

  // ─── Audit Log ────────────────────────────────────────────
  AUDIT_VIEW = 'audit:view',

  // ─── Roles (الأدوار) ──────────────────────────────────────
  ROLE_VIEW = 'role:view',
  ROLE_CREATE = 'role:create',
  ROLE_UPDATE = 'role:update',
  ROLE_DELETE = 'role:delete',
  ROLE_ASSIGN_PERMISSIONS = 'role:assign_permissions',

  // ─── Permissions (الصلاحيات) ──────────────────────────────
  PERMISSION_VIEW = 'permission:view',
  PERMISSION_MANAGE = 'permission:manage',

  // ─── Permission Groups ────────────────────────────────────
  GROUP_VIEW = 'group:view',
  GROUP_CREATE = 'group:create',
  GROUP_UPDATE = 'group:update',
  GROUP_DELETE = 'group:delete',

  // ─── User Overrides ───────────────────────────────────────
  USER_OVERRIDE = 'user:override',

  // ─── Analytics ────────────────────────────────────────────
  ANALYTICS_VIEW = 'analytics:view',

  // ─── Settings ─────────────────────────────────────────────
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_UPDATE = 'settings:update',
}
