import { useEffect } from 'react';
import { useFetch } from '@/hooks/use-api';
import { DashboardStats, Appointment } from '@/types';
import { queryKeys } from './query-keys';
import toast from 'react-hot-toast';

export function useDashboardStats() {
  const query = useFetch<DashboardStats>(
    queryKeys.dashboard.stats,
    '/analytics/dashboard',
  );

  useEffect(() => {
    if (query.error) {
      toast.error('فشل تحميل إحصائيات لوحة التحكم');
    }
  }, [query.error]);

  return {
    ...query,
    stats: query.data?.data,
  };
}

export function useTodayAppointments() {
  const query = useFetch<Appointment[]>(
    queryKeys.dashboard.todayAppointments,
    '/appointments/today',
  );

  useEffect(() => {
    if (query.error) {
      toast.error('فشل تحميل مواعيد اليوم');
    }
  }, [query.error]);

  return {
    ...query,
    appointments: query.data?.data ?? [],
  };
}
