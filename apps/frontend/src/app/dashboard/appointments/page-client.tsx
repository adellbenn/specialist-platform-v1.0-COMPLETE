'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Plus, List, Calendar, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsService, AppointmentQuery } from '@/services/appointments.service';
import { AppointmentCard } from '@/components/appointments/appointment-card';
import { ListSkeleton, CalendarSkeleton, StatsRowSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PermissionGate } from '@/components/auth/permission-gate';
import { useAppointmentsList, useAppointmentStats } from '@/hooks/queries/use-appointments';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { AppointmentStatus } from '@/types';

const AdvancedCalendar = dynamic(
  () => import('@/components/calendar').then((mod) => ({ default: mod.Calendar })),
  /* PageLoader كان يفرغ الصفحة كاملة عند أول فتح لعرض التقويم؛ الـskeleton
     يحافظ على ارتفاع التقويم فلا ترتجف الشبكة عند الجلب. */
  { ssr: false, loading: () => <CalendarSkeleton /> },
);

type ViewMode = 'calendar' | 'list';

const STATUS_FILTERS: Array<{ value: AppointmentStatus | ''; label: string }> = [
  { value: '', label: 'الكل' },
  { value: 'scheduled', label: 'مجدول' },
  { value: 'confirmed', label: 'مؤكد' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغي' },
  { value: 'no_show', label: 'لم يحضر' },
];

export default function AppointmentsPageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>('calendar');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('');
  const [cancelTarget, setCancelTarget] = useState<{ id: string; reason: string } | null>(null);

  const listQuery: AppointmentQuery = { limit: 50 };
  if (statusFilter) listQuery.status = statusFilter;

  const { stats } = useAppointmentStats();
  const { appointments, isLoading } = useAppointmentsList(listQuery, { enabled: view === 'list' });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const confirmMutation = useMutation({
    mutationFn: (id: string) => appointmentsService.confirm(id),
    onSuccess: () => {
      toast.success('تم تأكيد الموعد');
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'فشل التأكيد');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      appointmentsService.cancel(id, reason),
    onSuccess: () => {
      toast.success('تم إلغاء الموعد');
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'فشل الإلغاء');
    },
  });

  const handleConfirm = (id: string) => confirmMutation.mutate(id);

  const handleCancel = (id: string) => {
    setCancelTarget({ id, reason: '' });
  };

  const submitCancel = () => {
    if (!cancelTarget) return;
    cancelMutation.mutate({ id: cancelTarget.id, reason: cancelTarget.reason || '' });
    setCancelTarget(null);
  };

  const handleComplete = (id: string) => {
    router.push(`/dashboard/appointments/${id}?action=complete`);
  };

  return (
    <div className="space-y-5 relative">
      <div className="flex items-center justify-between flex-wrap gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary text-white shadow-xs">
            <Calendar size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">المواعيد</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {stats ? `${stats.upcoming} موعد قادم — ${stats.completionRate}% نسبة الإتمام` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-surface rounded-lg p-1">
            <Button
              size="sm"
              variant={view === 'calendar' ? 'primary' : 'ghost'}
              icon={Calendar}
              onClick={() => setView('calendar')}
            >
              تقويم
            </Button>
            <Button
              size="sm"
              variant={view === 'list' ? 'primary' : 'ghost'}
              icon={List}
              onClick={() => setView('list')}
            >
              قائمة
            </Button>
          </div>
          <PermissionGate permission="appointment:create">
            <Button icon={Plus} onClick={() => router.push('/dashboard/appointments/new')}>
              موعد جديد
            </Button>
          </PermissionGate>
        </div>
      </div>
      {/* الإحصائيات غير جاهزة: نفس الأبعاد، لا إزاحة */}
      {!stats && <StatsRowSkeleton />}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'قادمة', value: stats.upcoming, icon: Clock, color: 'bg-[var(--status-scheduled-light)] text-[var(--status-scheduled-text)]' },
            { label: 'مكتملة', value: stats.completed, icon: CheckCircle, color: 'bg-[var(--status-success-light)] text-[var(--status-success-text)]' },
            { label: 'ملغاة', value: stats.cancelled, icon: XCircle, color: 'bg-[var(--status-cancelled-light)] text-[var(--status-cancelled-text)]' },
            { label: 'لم يحضر', value: stats.noShow, icon: AlertCircle, color: 'bg-[var(--status-error-light)] text-[var(--status-error-text)]' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`rounded-xl p-3.5 flex items-center gap-3 ${s.color}`}>
                <Icon size={20} className="opacity-80 flex-shrink-0" />
                <div>
                  <p className="text-xl font-bold leading-none">{s.value}</p>
                  <p className="text-xs mt-0.5 opacity-70">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'calendar' && <AdvancedCalendar />}

      {view === 'list' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={statusFilter === f.value ? 'primary' : 'outline'}
                onClick={() => setStatusFilter(f.value as any)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {/* الجلب هنا بعد تفويض الصلاحيات: skeleton محلي للشبكة فقط،
                  والترويسة والمرشّحات تبقيان ظاهرتين. */}
          {isLoading ? <ListSkeleton /> : appointments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="لا توجد مواعيد"
              description="لم يتم إنشاء أي مواعيد بعد"
              action={
                <PermissionGate permission="appointment:create">
                  <Button icon={Plus} size="sm" onClick={() => router.push('/dashboard/appointments/new')}>
                    موعد جديد
                  </Button>
                </PermissionGate>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {appointments.map((a) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  confirming={confirmMutation.isPending}
                  cancelling={cancelMutation.isPending}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                  onComplete={handleComplete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="إلغاء الموعد"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>إلغاء</Button>
            <Button variant="danger" loading={cancelMutation.isPending} onClick={submitCancel}>تأكيد الإلغاء</Button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">سيتم إلغاء الموعد، ويمكنك إضافة سبب (اختياري).</p>
          <Textarea
            rows={3}
            placeholder="سبب الإلغاء..."
            value={cancelTarget?.reason ?? ''}
            onChange={(e) => setCancelTarget((prev) => prev ? { ...prev, reason: e.target.value } : prev)}
          />
        </div>
      </Dialog>
    </div>
  );
}
