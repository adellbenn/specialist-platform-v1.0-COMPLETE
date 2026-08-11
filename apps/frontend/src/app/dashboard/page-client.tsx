'use client';

import {
  Users, Calendar, FileText,
  TrendingUp, DollarSign, Clock, AlertTriangle,
  CheckCircle, BarChart3, Activity,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks/use-permissions';
import { useDashboardStats, useTodayAppointments } from '@/hooks/queries/use-dashboard';
import { Card, SectionHeader } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { ROLE_LABELS, UserRole } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS } from '@/types';
import { cn } from '@/lib/utils';
import { CASE_TYPE_LABELS } from '@/types';
import Link from 'next/link';

export default function DashboardPageClient() {
  const { user } = useAuthStore();
  const { can } = usePermissions();
  const { stats: s, isLoading: statsLoading } = useDashboardStats();
  const { appointments: todayAppts, isLoading: apptsLoading } = useTodayAppointments();

  if (statsLoading || apptsLoading) return <PageLoader />;

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
            <div className="rounded-xl border border-border p-5 transition-all duration-150 hover:border-border-hover hover:shadow-card-hover cursor-pointer bg-background">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary">
                  <Users size={18} className="text-white" />
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-primary-light text-primary">
                  +{s.beneficiaries.newThisWeek} هذا الأسبوع
                </span>
              </div>
              <p className="text-2xl font-semibold text-text-primary">{s.beneficiaries.active}</p>
              <p className="text-small text-text-secondary mt-0.5">مستفيد نشط</p>
              <p className="text-xs text-text-muted mt-1">الإجمالي: {s.beneficiaries.total}</p>
            </div>
          </Link>

          <Link href="/dashboard/appointments">
            <div className="rounded-xl border border-border p-5 transition-all duration-150 hover:border-border-hover hover:shadow-card-hover cursor-pointer bg-background">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-light">
                  <Activity size={18} className="text-primary" />
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-primary-light text-primary">
                  {s.sessions.attendanceRate}% حضور
                </span>
              </div>
              <p className="text-2xl font-semibold text-text-primary">{s.sessions.thisMonth}</p>
              <p className="text-small text-text-secondary mt-0.5">جلسة هذا الشهر</p>
              <p className="text-xs text-text-muted mt-1">الإجمالي: {s.sessions.total}</p>
            </div>
          </Link>

          <Link href="/dashboard/appointments">
            <div className="rounded-xl border border-border p-5 transition-all duration-150 hover:border-border-hover hover:shadow-card-hover cursor-pointer bg-background">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-light">
                  <Calendar size={18} className="text-primary" />
                </div>
                {s.appointments.pendingReports > 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-warning-light text-warning">
                    {s.appointments.pendingReports} تقرير معلق
                  </span>
                )}
              </div>
              <p className="text-2xl font-semibold text-text-primary">{s.appointments.today}</p>
              <p className="text-small text-text-secondary mt-0.5">موعد اليوم</p>
              <p className="text-xs text-text-muted mt-1">{s.appointments.upcoming} قادم</p>
            </div>
          </Link>

          {can('payment:view') && (
            <Link href="/dashboard/payments">
              <div className="rounded-xl border border-border p-5 transition-all duration-150 hover:border-border-hover hover:shadow-card-hover cursor-pointer bg-background">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary">
                    <DollarSign size={18} className="text-white" />
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-primary-light text-primary">
                    {s.subscriptions.active} اشتراك
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
              <div key={item.label} className={cn('rounded-xl p-4 flex items-center gap-3 border border-border', item.color)}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-background/60">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-xl font-semibold leading-none">{item.value}</p>
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
            <div className="rounded-xl px-4 py-3 flex items-center gap-3 border border-warning/20 bg-warning-light">
              <AlertTriangle size={16} className="text-warning flex-shrink-0" />
              <p className="text-small text-text-primary">
                <span className="font-semibold">{s.subscriptions.expiringSoon}</span> اشتراك ينتهي خلال 7 أيام
              </p>
              <Link href="/dashboard/payments" className="mr-auto text-xs font-medium text-primary hover:text-primary-hover transition-colors">
                عرض
              </Link>
            </div>
          )}
          {s.appointments.pendingReports > 0 && can('report:approve') && (
            <div className="rounded-xl px-4 py-3 flex items-center gap-3 border border-primary/20 bg-primary-light">
              <FileText size={16} className="text-primary flex-shrink-0" />
              <p className="text-small text-text-primary">
                <span className="font-semibold">{s.appointments.pendingReports}</span> تقرير بانتظار الموافقة
              </p>
              <Link href="/dashboard/reports?status=submitted" className="mr-auto text-xs font-medium text-primary hover:text-primary-hover transition-colors">
                مراجعة
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <SectionHeader
              icon={Clock}
              title="مواعيد اليوم"
              subtitle={`${todayAppts.length} موعد`}
              action={
                <Link href="/dashboard/appointments" className="text-xs text-primary hover:text-primary-hover transition-colors font-medium">
                  عرض الكل
                </Link>
              }
            />
            {todayAppts.length === 0 ? (
              <div className="text-center py-8">
                <Calendar size={32} className="mx-auto mb-2 text-text-muted opacity-30" />
                <p className="text-small text-text-muted">لا توجد مواعيد اليوم</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayAppts.slice(0, 6).map((appt) => (
                  <Link key={appt.id} href={`/dashboard/appointments/${appt.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface transition-colors cursor-pointer">
                      <div className="text-center flex-shrink-0 w-14">
                        <p className="text-small font-semibold text-text-primary">
                          {new Date(appt.scheduledAt).toLocaleTimeString('ar', {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                        <p className="text-xs text-text-muted">{appt.durationMinutes}د</p>
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
                    +{todayAppts.length - 6} موعد آخر
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
              <div className="space-y-3">
                {[
                  { label: 'حضر', value: s.sessions.present, color: 'var(--primary)', pct: s.sessions.total ? Math.round(s.sessions.present / s.sessions.total * 100) : 0 },
                  { label: 'غاب', value: s.sessions.absent, color: 'var(--border)', pct: s.sessions.total ? Math.round(s.sessions.absent / s.sessions.total * 100) : 0 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary">{item.label}</span>
                      <span className="font-medium text-text-primary">{item.value} ({item.pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-surface">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <SectionHeader icon={TrendingUp} title="روابط سريعة" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/dashboard/beneficiaries/new', label: 'مستفيد جديد', permission: 'beneficiary:create' },
                { href: '/dashboard/appointments/new', label: 'موعد جديد', permission: 'appointment:create' },
                { href: '/dashboard/reports/new', label: 'تقرير جديد', permission: 'report:create' },
                { href: '/dashboard/payments', label: 'المدفوعات', permission: 'payment:view' },
              ]
                .filter((item) => can(item.permission as any))
                .map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className="text-center py-2.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-surface hover:text-text-primary border border-border transition-colors cursor-pointer">
                      {item.label}
                    </div>
                  </Link>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
