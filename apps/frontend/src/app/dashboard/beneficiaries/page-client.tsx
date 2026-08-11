'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Users } from 'lucide-react';
import { BeneficiaryQuery } from '@/services/beneficiaries.service';
import { useBeneficiariesList, useBeneficiaryStats } from '@/hooks/queries/use-beneficiaries';
import { BeneficiaryCard } from '@/components/beneficiaries/beneficiary-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { PermissionGate } from '@/components/auth/permission-gate';
import {
  BeneficiaryStatus,
  CaseType, CASE_TYPE_LABELS,
} from '@/types';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function BeneficiariesPageClient() {
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery] = useState<BeneficiaryQuery>({ status: 'active', limit: 24 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');

  const { beneficiaries, total, isLoading } = useBeneficiariesList(query, page);
  const { stats } = useBeneficiaryStats();

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((q) => ({ ...q, search: searchInput || undefined }));
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const totalPages = Math.ceil(total / (query.limit || 24));

  const STATUS_FILTERS: Array<{ value: BeneficiaryStatus | ''; label: string }> = [
    { value: '', label: t('beneficiaries.all') },
    { value: 'active', label: t('beneficiaries.active') },
    { value: 'inactive', label: t('beneficiaries.inactive') },
    { value: 'completed', label: t('beneficiaries.completed') },
    { value: 'archived', label: t('beneficiaries.archived') },
  ];

  const CASE_FILTERS: Array<{ value: CaseType | ''; label: string }> = [
    { value: '', label: t('beneficiaries.all_cases') },
    ...Object.entries(CASE_TYPE_LABELS).map(([value]) => ({
      value: value as CaseType,
      label: t(`beneficiaries.case_${value}` as any),
    })),
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('beneficiaries.title')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {t('beneficiaries.total_count', { count: total })}
          </p>
        </div>
        <PermissionGate writerOnly>
          <button
            onClick={() => router.push('/dashboard/beneficiaries/new')}
            className="flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <Plus size={16} />
            {t('beneficiaries.new')}
          </button>
        </PermissionGate>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: t('beneficiaries.active'), value: stats.active, bg: 'var(--success-light)', color: 'var(--success-text)' },
            { label: t('beneficiaries.completed'), value: stats.completed, bg: 'var(--info-light)', color: 'var(--info-text)' },
            { label: t('beneficiaries.inactive'), value: stats.total - stats.active - stats.completed - stats.archived, bg: 'var(--surface)', color: 'var(--text-secondary)' },
            { label: t('beneficiaries.archived'), value: stats.archived, bg: 'var(--danger-light)', color: 'var(--danger-text)' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-3 text-center"
              style={{ backgroundColor: s.bg, color: s.color }}
            >
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div
        className="rounded-xl border p-4 space-y-3"
        style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
      >
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('beneficiaries.search_placeholder')}
            className="w-full pr-9 pl-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--background)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border)',
            }}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setQuery((q) => ({ ...q, status: f.value as any })); setPage(1); }}
              className={cn('px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition font-medium')}
              style={
                (query.status ?? '') === f.value
                  ? { backgroundColor: 'var(--primary)', color: '#ffffff' }
                  : { backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {CASE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setQuery((q) => ({ ...q, caseType: f.value as any })); setPage(1); }}
              className={cn('px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition')}
              style={
                (query.caseType ?? '') === f.value
                  ? { backgroundColor: 'var(--surface-secondary)', color: 'var(--text-primary)' }
                  : { backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : beneficiaries.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('beneficiaries.no_results')}
          description={t('beneficiaries.no_results_desc')}
          action={
            <PermissionGate writerOnly>
              <button
                onClick={() => router.push('/dashboard/beneficiaries/new')}
                className="flex items-center gap-2 text-white text-sm px-4 py-2 rounded-lg"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <Plus size={15} /> {t('beneficiaries.add_first')}
              </button>
            </PermissionGate>
          }
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {beneficiaries.map((b) => (
              <BeneficiaryCard key={b.id} beneficiary={b} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
              >
                {t('common.previous')}
              </button>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
