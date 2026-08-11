// ═══════════════════════════════════════════
// BENEFICIARIES
// ═══════════════════════════════════════════

export type Gender = 'male' | 'female';
export type CaseType = 'psychological' | 'educational' | 'speech' | 'occupational' | 'social';
export type BeneficiaryStatus = 'active' | 'inactive' | 'completed' | 'archived';
export type ReferralSource = 'self' | 'hospital' | 'school' | 'other';

export interface GoalItem {
  id: string;
  description: string;
  targetDate: string;
  status: 'pending' | 'in_progress' | 'achieved' | 'cancelled';
  notes?: string;
}

export interface DiagnosisItem {
  code?: string;
  name: string;
  date: string;
  diagnosedBy?: string;
  notes?: string;
}

export interface Beneficiary {
  id: string;
  tenantId: string;
  fileNumber: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  dateOfBirth: string | null;
  gender: Gender | null;
  nationalId: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianRelationship: string | null;
  referralSource: ReferralSource | null;
  caseType: CaseType;
  status: BeneficiaryStatus;
  assignedSpecialistId: string | null;
  assignedSpecialist?: { id: string; firstName: string; lastName: string } | null;
  intakeDate: string;
  notes: string | null;
  createdBy?: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface BeneficiaryFile {
  id: string;
  beneficiaryId: string;
  tenantId: string;
  diagnosis: DiagnosisItem[] | null;
  medicalHistory: string | null;
  educationalHistory: string | null;
  familyHistory: string | null;
  assessmentResults: Record<string, unknown> | null;
  goals: GoalItem[] | null;
  updatedAt: string;
}

export interface BeneficiaryStats {
  total: number;
  active: number;
  completed: number;
  archived: number;
  byType: Array<{ caseType: CaseType; count: string }>;
}

// ─── Labels ───────────────────────────────────────────────────

export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  psychological: 'نفسي',
  educational:   'تربوي',
  speech:        'نطق وتواصل',
  occupational:  'وظيفي وتأهيلي',
  social:        'اجتماعي',
};

export const STATUS_LABELS: Record<BeneficiaryStatus, string> = {
  active:    'نشط',
  inactive:  'غير نشط',
  completed: 'مكتمل',
  archived:  'مؤرشف',
};

export const STATUS_COLORS: Record<BeneficiaryStatus, string> = {
  active:    'bg-[var(--status-success-light)] text-[var(--status-success-text)]',
  inactive:  'bg-[var(--surface-secondary)] text-[var(--text-muted)]',
  completed: 'bg-[var(--status-info-light)] text-[var(--status-info-text)]',
  archived:  'bg-[var(--status-cancelled-light)] text-[var(--status-cancelled-text)]',
};

export const GENDER_LABELS: Record<Gender, string> = {
  male:   'ذكر',
  female: 'أنثى',
};

export const CASE_TYPE_COLORS: Record<CaseType, string> = {
  psychological: 'bg-[var(--status-scheduled-light)] text-[var(--status-scheduled-text)]',
  educational:   'bg-[var(--status-info-light)] text-[var(--status-info-text)]',
  speech:        'bg-[var(--status-completed-light)] text-[var(--status-completed-text)]',
  occupational:  'bg-[var(--status-warning-light)] text-[var(--status-warning-text)]',
  social:        'bg-[var(--status-cancelled-light)] text-[var(--status-cancelled-text)]',
};

export const GOAL_STATUS_LABELS = {
  pending:     'قيد الانتظار',
  in_progress: 'قيد التنفيذ',
  achieved:    'محقق',
  cancelled:   'ملغي',
};

// ═══════════════════════════════════════════
// AUTH & USERS
// ═══════════════════════════════════════════

export type UserRole =
  | 'super_admin'
  | 'center_manager'
  | 'supervisor'
  | 'specialist'
  | 'receptionist'
  | 'accountant'
  | 'beneficiary';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  roleId?: string;
  tenantId: string | null;
  avatarUrl: string | null;
  themePreference?: string;
  tenant?: { id: string; name: string } | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ═══════════════════════════════════════════
// TENANT
// ═══════════════════════════════════════════

export type TenantType = 'clinic' | 'rehabilitation' | 'educational' | 'support';
export type SubscriptionPlan = 'basic' | 'professional' | 'enterprise';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt: string | null;
  maxUsers: number;
  maxBeneficiaries: number;
  isActive: boolean;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
}

// ═══════════════════════════════════════════
// API RESPONSE
// ═══════════════════════════════════════════

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
}

// ═══════════════════════════════════════════
// ROLE PERMISSIONS
// ═══════════════════════════════════════════

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'المدير العام',
  center_manager: 'مدير المركز',
  supervisor: 'المشرف',
  specialist: 'الأخصائي',
  receptionist: 'موظف الاستقبال',
  accountant: 'المحاسب',
  beneficiary: 'المستفيد',
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 6,
  center_manager: 5,
  supervisor: 4,
  specialist: 3,
  receptionist: 2,
  accountant: 2,
  beneficiary: 1,
};

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// ═══════════════════════════════════════════
// APPOINTMENTS
// ═══════════════════════════════════════════

export type AppointmentType   = 'initial' | 'follow_up' | 'assessment' | 'group';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type AttendanceStatus  = 'present' | 'absent' | 'late' | 'excused';

export interface Appointment {
  id: string;
  tenantId: string;
  beneficiaryId: string;
  beneficiary?: { id: string; firstName: string; lastName: string; fileNumber: string };
  specialistId: string;
  specialist?: { id: string; firstName: string; lastName: string };
  scheduledAt: string;
  durationMinutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  location: string | null;
  notes: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  tenantId: string;
  appointmentId: string | null;
  beneficiaryId: string;
  beneficiary?: { id: string; firstName: string; lastName: string; fileNumber: string };
  specialistId: string;
  specialist?: { id: string; firstName: string; lastName: string };
  sessionNumber: number;
  startedAt: string;
  endedAt: string | null;
  actualDurationMinutes: number | null;
  attendance: AttendanceStatus;
  moodAssessment: number | null;
  objectivesMet: boolean | null;
  sessionNotes: string | null;
  interventionsUsed: string[] | null;
  homeworkAssigned: string | null;
  nextSessionPlan: string | null;
  createdAt: string;
}

export interface AppointmentStats {
  total: number;
  thisMonth: number;
  completed: number;
  cancelled: number;
  noShow: number;
  upcoming: number;
  completionRate: number;
}

export interface SessionStats {
  total: number;
  thisMonth: number;
  present: number;
  absent: number;
  attendanceRate: number;
}

// ─── Labels ───────────────────────────────────────────────────

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  initial:    'جلسة أولى',
  follow_up:  'متابعة',
  assessment: 'تقييم',
  group:      'جماعية',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled:  'مجدول',
  confirmed:  'مؤكد',
  completed:  'مكتمل',
  cancelled:  'ملغي',
  no_show:    'لم يحضر',
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled:  'bg-[var(--status-scheduled-light)] text-[var(--status-scheduled-text)]',
  confirmed:  'bg-[var(--status-info-light)] text-[var(--status-info-text)]',
  completed:  'bg-[var(--status-completed-light)] text-[var(--status-completed-text)]',
  cancelled:  'bg-[var(--status-cancelled-light)] text-[var(--status-cancelled-text)]',
  no_show:    'bg-[var(--status-error-light)] text-[var(--status-error-text)]',
};

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: 'حاضر',
  absent:  'غائب',
  late:    'متأخر',
  excused: 'بعذر',
};

// ─── Calendar ───────────────────────────────────────────────────

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarFilters {
  specialistId?: string;
  beneficiaryId?: string;
  status?: AppointmentStatus;
  type?: AppointmentType;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CalendarDay {
  date: string;
  dayNum: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
}

export interface CalendarWeek {
  weekStart: string;
  weekEnd: string;
  days: CalendarDay[];
}

export interface WorkingHours {
  dayOfWeek: number;
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface CalendarColorConfig {
  status: Record<AppointmentStatus, { bg: string; text: string; dot: string }>;
  type: Record<AppointmentType, { bg: string; text: string; dot: string }>;
}

export const CALENDAR_DEFAULT_COLORS: CalendarColorConfig = {
  status: {
    scheduled:  { bg: 'var(--status-scheduled-light)', text: 'var(--status-scheduled-text)', dot: 'var(--status-scheduled)' },
    confirmed:  { bg: 'var(--status-info-light)', text: 'var(--status-info-text)', dot: 'var(--status-info)' },
    completed:  { bg: 'var(--status-completed-light)', text: 'var(--status-completed-text)', dot: 'var(--status-completed)' },
    cancelled:  { bg: 'var(--status-cancelled-light)', text: 'var(--status-cancelled-text)', dot: 'var(--status-cancelled)' },
    no_show:    { bg: 'var(--status-warning-light)', text: 'var(--status-warning-text)', dot: 'var(--status-warning)' },
  },
  type: {
    initial:    { bg: 'var(--status-info-light)', text: 'var(--status-info-text)', dot: 'var(--status-info)' },
    follow_up:  { bg: 'var(--status-scheduled-light)', text: 'var(--status-scheduled-text)', dot: 'var(--status-scheduled)' },
    assessment: { bg: 'var(--status-warning-light)', text: 'var(--status-warning-text)', dot: 'var(--status-warning)' },
    group:      { bg: 'var(--status-completed-light)', text: 'var(--status-completed-text)', dot: 'var(--status-completed)' },
  },
};

export const PRIORITY_LABELS: Record<string, string> = {
  normal:  'عادي',
  urgent:  'عاجل',
  high:    'عالٍ',
  low:     'منخفض',
};

export const PRIORITY_COLORS: Record<string, string> = {
  normal: 'bg-[var(--status-cancelled-light)] text-[var(--status-cancelled-text)]',
  urgent: 'bg-[var(--status-error-light)] text-[var(--status-error-text)]',
  high:   'bg-[var(--status-warning-light)] text-[var(--status-warning-text)]',
  low:    'bg-[var(--status-info-light)] text-[var(--status-info-text)]',
};

// ═══════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════

export type ReportType   = 'initial_assessment' | 'progress' | 'periodic' | 'final' | 'referral';
export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'archived';

export interface ReportContent {
  summary?:         string;
  currentStatus?:   string;
  goalsProgress?:   Array<{ goalId: string; description: string; progress: number; notes: string }>;
  interventions?:   string[];
  challenges?:      string;
  achievements?:    string;
  behaviorChanges?: string;
  familyFeedback?:  string;
  referralReason?:  string;
  referralTo?:      string;
  [key: string]:    unknown;
}

export interface Report {
  id: string;
  tenantId: string;
  beneficiaryId: string;
  beneficiary?: { id: string; firstName: string; lastName: string; fileNumber: string };
  specialistId: string;
  specialist?:  { id: string; firstName: string; lastName: string };
  type: ReportType;
  title: string;
  periodFrom: string | null;
  periodTo:   string | null;
  content: ReportContent;
  recommendations: string | null;
  status: ReportStatus;
  sharedWithBeneficiary: boolean;
  approvedById: string | null;
  approvedBy?:  { id: string; firstName: string; lastName: string } | null;
  approvedAt:   string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportStats {
  total: number;
  drafts: number;
  submitted: number;
  approved: number;
  archived: number;
  byType: Array<{ type: ReportType; count: string }>;
}

// ─── Labels ───────────────────────────────────────────────────

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  initial_assessment: 'تقييم أولي',
  progress:           'تقرير تقدم',
  periodic:           'دوري',
  final:              'ختامي',
  referral:           'إحالة',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft:     'مسودة',
  submitted: 'قيد المراجعة',
  approved:  'موافق عليه',
  archived:  'مؤرشف',
};

export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  draft:     'bg-[var(--surface-secondary)] text-[var(--text-muted)]',
  submitted: 'bg-[var(--status-warning-light)] text-[var(--status-warning-text)]',
  approved:  'bg-[var(--status-success-light)] text-[var(--status-success-text)]',
  archived:  'bg-[var(--status-cancelled-light)] text-[var(--status-cancelled-text)]',
};

// ═══════════════════════════════════════════
// FILES
// ═══════════════════════════════════════════

export type FileEntityType = 'beneficiary' | 'session' | 'report' | 'invoice';

export interface FileAttachment {
  id: string;
  tenantId: string;
  entityType: FileEntityType;
  entityId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  originalName: string;
  uploadedById: string | null;
  uploadedBy?: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/'))      return '🖼️';
  if (mimeType === 'application/pdf')     return '📄';
  if (mimeType.includes('word'))          return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  return '📎';
}

// ═══════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════

export interface ServicePackage {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  sessionsCount: number;
  price: number;
  validityDays: number;
  isActive: boolean;
  createdAt: string;
}

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'completed';
export type PaymentMethod      = 'cash' | 'card' | 'transfer' | 'insurance';
export type PaymentStatus      = 'pending' | 'paid' | 'partial' | 'refunded';

export interface Subscription {
  id: string;
  tenantId: string;
  beneficiaryId: string;
  beneficiary?: { id: string; firstName: string; lastName: string; fileNumber: string };
  packageId: string | null;
  package?: { id: string; name: string; sessionsCount: number } | null;
  sessionsUsed: number;
  sessionsRemaining: number;
  amountPaid: number;
  discountAmount: number;
  startDate: string;
  expiryDate: string;
  status: SubscriptionStatus;
  createdAt: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  beneficiaryId: string;
  beneficiary?: { id: string; firstName: string; lastName: string; fileNumber: string };
  subscriptionId: string | null;
  amount: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  notes: string | null;
  createdBy?: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
}

export interface PaymentStats {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  activeSubscriptions: number;
  totalRevenue: number;
  monthRevenue: number;
}

// ─── Labels ───────────────────────────────────────────────────

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending:  'قيد الانتظار',
  paid:     'مدفوع',
  partial:  'مدفوع جزئياً',
  refunded: 'مسترد',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending:  'bg-[var(--status-warning-light)] text-[var(--status-warning-text)]',
  paid:     'bg-[var(--status-success-light)] text-[var(--status-success-text)]',
  partial:  'bg-[var(--status-info-light)] text-[var(--status-info-text)]',
  refunded: 'bg-[var(--status-cancelled-light)] text-[var(--status-cancelled-text)]',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash:      'نقداً',
  card:      'بطاقة بنكية',
  transfer:  'تحويل بنكي',
  insurance: 'تأمين',
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active:    'نشط',
  expired:   'منتهي',
  cancelled: 'ملغي',
  completed: 'مكتمل',
};

export const SUBSCRIPTION_STATUS_COLORS: Record<SubscriptionStatus, string> = {
  active:    'bg-[var(--status-success-light)] text-[var(--status-success-text)]',
  expired:   'bg-[var(--status-warning-light)] text-[var(--status-warning-text)]',
  cancelled: 'bg-[var(--status-error-light)] text-[var(--status-error-text)]',
  completed: 'bg-[var(--status-info-light)] text-[var(--status-info-text)]',
};

// ═══════════════════════════════════════════
// PERMISSIONS & ROLES
// ═══════════════════════════════════════════

export interface Permission {
  id: string;
  module: string;
  action: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  sortOrder: number;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  isActive: boolean;
  isSystem: boolean;
  priority: number;
  createdById: string | null;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description: string | null;
  color: string;
  isActive: boolean;
  isSystem: boolean;
  createdById: string | null;
  permissions: Permission[];
}

export interface RoleStats {
  totalRoles: number;
  activeRoles: number;
  systemRoles: number;
}

// ═══════════════════════════════════════════
// USER PERMISSION OVERRIDES
// ═══════════════════════════════════════════

export interface UserPermissionOverride {
  id: string;
  userId: string;
  permissionId: string;
  permission: Permission;
  overrideType: 'granted' | 'denied';
  grantedById: string | null;
  expiresAt: string | null;
  roleId: string | null;
}

export interface EffectivePermissions {
  granted: UserPermissionOverride[];
  denied: UserPermissionOverride[];
}

// ═══════════════════════════════════════════
// AUDIT LOGS
// ═══════════════════════════════════════════

export type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'APPROVE' | 'SUBMIT';

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string | null;
  user?: { id: string; firstName: string; lastName: string } | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  description: string | null;
  createdAt: string;
}

// ═══════════════════════════════════════════
// ANALYTICS / DASHBOARD
// ═══════════════════════════════════════════

export interface DashboardStats {
  beneficiaries: {
    total: number;
    active: number;
    newThisMonth: number;
    newThisWeek: number;
  };
  sessions: {
    total: number;
    thisMonth: number;
    present: number;
    absent: number;
    attendanceRate: number;
  };
  appointments: {
    today: number;
    upcoming: number;
    pendingReports: number;
  };
  subscriptions: {
    active: number;
    expiringSoon: number;
  };
  financial: {
    totalRevenue: number;
    monthRevenue: number;
  };
  team: {
    specialists: number;
  };
  specialist?: {
    myBeneficiaries: number;
    mySessions: number;
    mySessionsThisMonth: number;
    pendingToday: number;
  };
}

// ═══════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════

export interface SearchResult {
  beneficiaries: Beneficiary[];
  users: User[];
  appointments: Appointment[];
  files: FileAttachment[];
}
