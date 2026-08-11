'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Plus, List, Calendar, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsService, AppointmentQuery } from '@/services/appointments.service';
import { AppointmentCard } from '@/components/appointments/appointment-card';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { PermissionGate } from '@/components/auth/permission-gate';
import { useAppointmentsList, useAppointmentStats } from '@/hooks/queries/use-appointments';
import { queryKeys } from '@/hooks/queries/query-keys';
import {
  AppointmentStatus,
} from '@/types';
import { cn } from '@/lib/utils';

const AdvancedCalendar = dynamic(
  () => import('@/components/calendar').then((mod) => ({ default: mod.Calendar })),
  { ssr: false, loading: () => <PageLoader /> },
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
    const reason = prompt('سبب الإلغاء (اختياري)');
    if (reason === null) return;
    cancelMutation.mutate({ id, reason: reason || '' });
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
        <div className="flex items-center gap-2">
          <div className="flex bg-surface rounded-lg p-1">
            <button
              onClick={() => setView('calendar')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition',
                view === 'calendar' ? 'bg-background shadow-card text-primary font-medium' : 'text-text-secondary hover:text-text-primary')}
            >
              <Calendar size={15} /> تقويم
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition',
                view === 'list' ? 'bg-background shadow-card text-primary font-medium' : 'text-text-secondary hover:text-text-primary')}
            >
              <List size={15} /> قائمة
            </button>
          </div>
          <PermissionGate permission="appointment:create">
            <button
              onClick={() => router.push('/dashboard/appointments/new')}
              className="flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg transition hover:bg-primary-hover"
            >
              <Plus size={15} /> موعد جديد
            </button>
          </PermissionGate>
        </div>
      </div>
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
              <div key={s.label} className={cn('rounded-xl p-3.5 flex items-center gap-3', s.color)}>
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
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value as any)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap font-medium transition',
                  statusFilter === f.value
                    ? 'bg-primary text-white'
                    : 'bg-surface text-text-secondary hover:bg-surface-secondary',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoading ? <PageLoader /> : appointments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="لا توجد مواعيد"
              description="لم يتم إنشاء أي مواعيد بعد"
              action={
                <PermissionGate permission="appointment:create">
                  <button
                    onClick={() => router.push('/dashboard/appointments/new')}
                    className="flex items-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-lg"
                  >
                    <Plus size={14} /> موعد جديد
                  </button>
                </PermissionGate>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {appointments.map((a) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                  onComplete={handleComplete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
