import { useEffect } from 'react';
import { useFetch } from '@/hooks/use-api';
import { Appointment, AppointmentStats } from '@/types';
import { AppointmentQuery } from '@/services/appointments.service';
import { buildQueryString } from '@/lib/utils';
import { queryKeys } from './query-keys';
import toast from 'react-hot-toast';

export function useAppointmentsList(
  query: AppointmentQuery,
  options?: { enabled?: boolean },
) {
  const url = `/appointments?${buildQueryString(query)}`;
  const q = useFetch<Appointment[]>(
    queryKeys.appointments.all(query),
    url,
    { enabled: options?.enabled },
  );

  useEffect(() => {
    if (q.error) {
      toast.error('فشل تحميل المواعيد');
    }
  }, [q.error]);

  return {
    ...q,
    appointments: q.data?.data ?? [],
  };
}

export function useAppointmentStats() {
  const q = useFetch<AppointmentStats>(
    queryKeys.appointments.stats,
    '/appointments/stats',
  );

  useEffect(() => {
    if (q.error) {
      toast.error('فشل تحميل إحصائيات المواعيد');
    }
  }, [q.error]);

  return {
    ...q,
    stats: q.data?.data,
  };
}
