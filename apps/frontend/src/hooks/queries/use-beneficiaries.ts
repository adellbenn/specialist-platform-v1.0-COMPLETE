import { useEffect } from 'react';
import { useFetch } from '@/hooks/use-api';
import { Beneficiary, BeneficiaryStats } from '@/types';
import { BeneficiaryQuery } from '@/services/beneficiaries.service';
import { buildQueryString } from '@/lib/utils';
import { queryKeys } from './query-keys';
import toast from 'react-hot-toast';

export function useBeneficiariesList(query: BeneficiaryQuery, page: number) {
  const params = { ...query, page };
  const url = `/beneficiaries?${buildQueryString(params)}`;
  const q = useFetch<Beneficiary[]>(
    queryKeys.beneficiaries.all(params),
    url,
  );

  useEffect(() => {
    if (q.error) {
      toast.error('فشل تحميل قائمة المستفيدين');
    }
  }, [q.error]);

  return {
    ...q,
    beneficiaries: q.data?.data ?? [],
    total: q.data?.meta?.total ?? 0,
  };
}

export function useBeneficiaryStats() {
  const q = useFetch<BeneficiaryStats>(
    queryKeys.beneficiaries.stats,
    '/beneficiaries/stats',
  );

  useEffect(() => {
    if (q.error) {
      toast.error('فشل تحميل إحصائيات المستفيدين');
    }
  }, [q.error]);

  return {
    ...q,
    stats: q.data?.data,
  };
}
