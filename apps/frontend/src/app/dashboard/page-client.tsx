'use client';

import { useMemo } from 'react';
import {
  Users, Calendar, FileText,
  TrendingUp, Wallet, Clock, AlertTriangle,
  CheckCircle, BarChart3, Activity,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks/use-permissions';
import { useDashboardStats, useTodayAppointments } from '@/hooks/queries/use-dashboard';
import { Card, SectionHeader } from '@/components/ui/card';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ProgressRing } from '@/components/ui/progress-ring';
import { ROLE_LABELS, UserRole } from '@/types';
import { formatCurrency, formatNumber, formatTime, cn } from '@/lib/utils';
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS } from '@/types';
import Link from 'next/link';

interface QuickAction {
  href: string;
  label: string;
  icon: React.ElementType;
  permission: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { href: '/dashboard/appointments/new', label: 'موعد جديد', icon: Calendar, permission: 'appointment:create' },
  { href: '/dashboard/beneficiaries/new', label: 'مستفيد جديد', icon: Users, permission: 'beneficiary:create' },
  { href: '/dashboard/sessions/new', label: 'جلسة جديدة', icon: Activity, permission: 'session:create' },
  { href: '/dashboard/payments/new-invoice', label: 'فاتورة جديدة', icon: FileText, permission: 'payment:create' },
];

export default function DashboardPageClient() {
  const { user } = useAuthStore();
  const { can } = usePermissions();
  const { stats: s, isLoading: statsLoading } = useDashboardStats();
  const { appointments: todayAppts, isLoading: apptsLoading } = useTodayAppointments();

  /* أقرب موعد قادم من مواعيد اليوم (يتجاهل المنتهي والملغي). */
  const nextAppointment = useMemo(() => {
    const now = Date.now();
    return (
      todayAppts
        .filter(
          (a) =>
            a.status !== 'cancelled' &&
            a.status !== 'no_show' &&
            a.status !== 'completed' &&
            new Date(a.scheduledAt).getTime() >= now,
        )
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0] ?? null
    );
  }, [todayAppts]);

  const quickActions = QUICK_ACTIONS.filter((action) => can(action.permission));

  /* spinner كان يحل محل الصفحة كاملة؛ PageSkeleton يحفظ بنية لوحة التحكم */
  if (statsLoading || apptsLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-semibold text-text-primary">
          مرحباً، {user?.firstName}
        </h1>
        <p className="mt-1 text-small text-text-secondary">
          {user ? ROLE_LABELS[user.role as UserRole] : ''} — {user?.tenant?.name ?? 'المنصة'}
        </p>
      </div>

      {s && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/beneficiaries">
            <div className="glass rounded-2xl border border-border p-5 transition-all duration-150 hover:border-border-hover hover:shadow-card-hover cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-primary-light">
                  <Users size={20} strokeWidth={1.9} className="text-primary" />
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-[9999px] bg-primary-light text-primary">
                  +{formatNumber(s.beneficiaries.newThisWeek)} هذا الأسبوع
                </span>
              </div>
              <p className="text-2xl font-semibold text-text-primary">{formatNumber(s.beneficiaries.active)}</p>
              <p className="text-small text-text-secondary mt-0.5">مستفيد نشط</p>
              <p className="text-xs text-text-muted mt-1">الإجمالي: {formatNumber(s.beneficiaries.total)}</p>
            </div>
          </Link>

          <Link href="/dashboard/appointments">
            <div className="glass rounded-2xl border border-border p-5 transition-all duration-150 hover:border-border-hover hover:shadow-card-hover cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-primary-light">
                  <Activity size={20} strokeWidth={1.9} className="text-primary" />
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-[9999px] bg-primary-light text-primary">
                  {formatNumber(s.sessions.attendanceRate)}% حضور
                </span>
              </div>
              <p className="text-2xl font-semibold text-text-primary">{formatNumber(s.sessions.thisMonth)}</p>
              <p className="text-small text-text-secondary mt-0.5">جلسة هذا الشهر</p>
              <p className="text-xs text-text-muted mt-1">الإجمالي: {formatNumber(s.sessions.total)}</p>
            </div>
          </Link>

          <Link href="/dashboard/appointments">
            <div className="glass rounded-2xl border border-border p-5 transition-all duration-150 hover:border-border-hover hover:shadow-card-hover cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-primary-light">
                  <Calendar size={20} strokeWidth={1.9} className="text-primary" />
                </div>
                {s.appointments.pendingReports > 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-[9999px] bg-warning-light text-warning">
                    {formatNumber(s.appointments.pendingReports)} تقرير معلق
                  </span>
                )}
              </div>
              <p className="text-2xl font-semibold text-text-primary">{formatNumber(s.appointments.today)}</p>
              <p className="text-small text-text-secondary mt-0.5">موعد اليوم</p>
              <p className="text-xs text-text-muted mt-1">{formatNumber(s.appointments.upcoming)} قادم</p>
            </div>
          </Link>

          {can('payment:view') && (
            <Link href="/dashboard/payments">
              <div className="glass rounded-2xl border border-border p-5 transition-all duration-150 hover:border-border-hover hover:shadow-card-hover cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-primary-light">
                    <Wallet size={20} strokeWidth={1.9} className="text-primary" />
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-[9999px] bg-primary-light text-primary">
                    {formatNumber(s.subscriptions.active)} اشتراك
                  </span>
                </div>
                <p className="text-xl font-semibold text-text-primary">
                  {formatCurrency(s.financial.monthRevenue)}
                </p>
                <p className="text-small text-text-secondary mt-0.5">إيرادات الشهر</p>
                <p className="text-xs text-text-muted mt-1">
                  الإجمالي: {formatCurrency(s.financial.totalRevenue)}
                </p>
              </div>
            </Link>
          )}
        </div>
      )}

      {s?.specialist && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'حالاتي', value: s.specialist.myBeneficiaries, icon: Users, color: 'bg-primary-light text-primary' },
            { label: 'جلساتي هذا الشهر', value: s.specialist.mySessionsThisMonth, icon: Activity, color: 'bg-primary-light text-primary' },
            { label: 'إجمالي جلساتي', value: s.specialist.mySessions, icon: BarChart3, color: 'bg-primary-light text-primary' },
            { label: 'مواعيد اليوم', value: s.specialist.pendingToday, icon: Clock, color: 'bg-surface text-text-primary' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={cn('glass rounded-2xl p-4 flex items-center gap-3 border border-border', item.color)}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-background/60">
                  <Icon size={16} strokeWidth={1.9} />
                </div>
                <div>
                  <p className="text-xl font-semibold leading-none">{formatNumber(item.value)}</p>
                  <p className="text-xs text-text-muted mt-0.5">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {s && (s.subscriptions.expiringSoon > 0 || s.appointments.pendingReports > 0) && (
        <div className="space-y-2">
          {s.subscriptions.expiringSoon > 0 && (
            <div className="rounded-2xl px-4 py-3 flex items-center gap-3 border border-warning/20 bg-warning-light">
              <AlertTriangle size={16} className="text-warning flex-shrink-0" />
              <p className="text-small text-text-primary">
                <span className="font-semibold">{formatNumber(s.subscriptions.expiringSoon)}</span> اشتراك ينتهي خلال 7 أيام
              </p>
              <Link href="/dashboard/payments" className="mr-auto text-xs font-medium text-primary hover:text-primary-hover transition-colors">
                عرض
              </Link>
            </div>
          )}
          {s.appointments.pendingReports > 0 && can('report:approve') && (
            <div className="rounded-2xl px-4 py-3 flex items-center gap-3 border border-primary/20 bg-primary-light">
              <FileText size={16} className="text-primary flex-shrink-0" />
              <p className="text-small text-text-primary">
                <span className="font-semibold">{formatNumber(s.appointments.pendingReports)}</span> تقرير بانتظار الموافقة
              </p>
              <Link href="/dashboard/reports?status=submitted" className="mr-auto text-xs font-medium text-primary hover:text-primary-hover transition-colors">
                مراجعة
              </Link>
            </div>
          )}
        </div>
      )}

      {quickActions.length > 0 && (
        <div>
          <SectionHeader icon={TrendingUp} title="روابط سريعة" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <div className="group glass flex flex-col items-center justify-center gap-2 rounded-2xl p-4 border border-border transition-all duration-150 hover:border-border-hover hover:shadow-card-hover cursor-pointer">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-primary-light text-primary">
                      <Icon size={20} strokeWidth={1.9} />
                    </div>
                    <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                      {action.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <SectionHeader
              icon={Clock}
              title="مواعيد اليوم"
              subtitle={`${formatNumber(todayAppts.length)} موعد`}
              action={
                <Link href="/dashboard/appointments" className="text-xs text-primary hover:text-primary-hover transition-colors font-medium">
                  عرض الكل
                </Link>
              }
            />

            {nextAppointment && (
              <Link href={`/dashboard/appointments/${nextAppointment.id}`}>
                <div
                  className="mb-3 rounded-2xl p-4 text-white cursor-pointer transition-transform duration-150 hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                    boxShadow: '0 10px 30px rgba(31,181,168,0.35)',
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs opacity-80">الموعد القادم</p>
                      <p className="text-base font-semibold truncate mt-0.5">
                        {nextAppointment.beneficiary?.firstName} {nextAppointment.beneficiary?.lastName}
                      </p>
                      <p className="text-xs opacity-80 truncate mt-0.5">
                        {nextAppointment.specialist?.firstName} {nextAppointment.specialist?.lastName}
                      </p>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <p className="text-lg font-bold leading-none">{formatTime(nextAppointment.scheduledAt)}</p>
                      <p className="text-[11px] opacity-80 mt-1">{formatNumber(nextAppointment.durationMinutes)}د</p>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {todayAppts.length === 0 ? (
              <div className="text-center py-8">
                <Calendar size={32} className="mx-auto mb-2 text-text-muted opacity-30" />
                <p className="text-small text-text-muted">لا توجد مواعيد اليوم</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayAppts.slice(0, 6).map((appt) => (
                  <Link key={appt.id} href={`/dashboard/appointments/${appt.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors cursor-pointer">
                      <div className="text-center flex-shrink-0 w-14">
                        <p className="text-small font-semibold text-text-primary">
                          {formatTime(appt.scheduledAt)}
                        </p>
                        <p className="text-xs text-text-muted">{formatNumber(appt.durationMinutes)}د</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-small font-medium text-text-primary truncate">
                          {appt.beneficiary?.firstName} {appt.beneficiary?.lastName}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                          {appt.specialist?.firstName} {appt.specialist?.lastName}
                        </p>
                      </div>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-md font-medium flex-shrink-0',
                        APPOINTMENT_STATUS_COLORS[appt.status],
                      )}>
                        {APPOINTMENT_STATUS_LABELS[appt.status]}
                      </span>
                    </div>
                  </Link>
                ))}
                {todayAppts.length > 6 && (
                  <p className="text-center text-xs text-text-muted pt-1">
                    +{formatNumber(todayAppts.length - 6)} موعد آخر
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {s && (
            <Card>
              <SectionHeader icon={CheckCircle} title="نسبة الحضور" />
              <div className="flex items-center gap-4">
                <ProgressRing
                  value={s.sessions.attendanceRate}
                  size={96}
                  strokeWidth={9}
                  showValue
                  trackColor="var(--border)"
                  aria-label="نسبة الحضور"
                />
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--primary)' }} />
                    <span className="text-text-secondary">حضر</span>
                    <span className="mr-auto font-medium text-text-primary">{formatNumber(s.sessions.present)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--border)' }} />
                    <span className="text-text-secondary">غاب</span>
                    <span className="mr-auto font-medium text-text-primary">{formatNumber(s.sessions.absent)}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
