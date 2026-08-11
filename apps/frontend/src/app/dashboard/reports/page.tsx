'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter }          from 'next/navigation';
import { Plus, FileText, CheckCircle, Clock, Archive, AlertCircle } from 'lucide-react';
import toast                  from 'react-hot-toast';
import { reportsService }     from '@/services/reports.service';
import { ReportCard }         from '@/components/reports/report-card';
import { PageLoader }         from '@/components/ui/spinner';
import { EmptyState }         from '@/components/ui/empty-state';
import { PermissionGate }     from '@/components/auth/permission-gate';
import {
  Report, ReportStats, ReportStatus, ReportType,
  REPORT_TYPE_LABELS, REPORT_STATUS_LABELS,
} from '@/types';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: Array<{ value: ReportStatus | ''; label: string }> = [
  { value: '',          label: 'الكل' },
  { value: 'draft',     label: 'مسودة' },
  { value: 'submitted', label: 'قيد المراجعة' },
  { value: 'approved',  label: 'موافق عليه' },
  { value: 'archived',  label: 'مؤرشف' },
];

const TYPE_FILTERS: Array<{ value: ReportType | ''; label: string }> = [
  { value: '', label: 'جميع الأنواع' },
  ...Object.entries(REPORT_TYPE_LABELS).map(([v, l]) => ({ value: v as ReportType, label: l })),
];

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports]   = useState<Report[]>([]);
  const [stats, setStats]       = useState<ReportStats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [typeFilter, setTypeFilter]     = useState<ReportType | ''>('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const rRes = await reportsService.getAll({
        status: statusFilter || undefined,
        type:   typeFilter   || undefined,
        page,
        limit:  18,
      });
      setReports(rRes.data.data);
      setTotal(rRes.data.meta?.total ?? 0);
    } catch {
      toast.error('فشل تحميل التقارير');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  useEffect(() => {
    reportsService.getStats()
      .then((sRes) => setStats(sRes.data.data))
      .catch(() => { /* الإحصائيات اختيارية */ });
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await reportsService.approve(id);
      toast.success('تمت الموافقة على التقرير');
      fetchReports();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل الموافقة');
    }
  };

  const handleToggleShare = async (id: string) => {
    try {
      const res = await reportsService.toggleShare(id);
      toast.success(res.data.message);
      fetchReports();
    } catch {
      toast.error('فشل تعديل المشاركة');
    }
  };

  const totalPages = Math.ceil(total / 18);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>التقارير</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            إجمالي: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{total}</span> تقرير
          </p>
        </div>
        <PermissionGate permission="report:create">
          <button
            onClick={() => router.push('/dashboard/reports/new')}
            className="flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            style={{ backgroundColor: 'var(--primary)' }}>
            <Plus size={15} /> تقرير جديد
          </button>
        </PermissionGate>
      </div>

      {/* Stats Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'مسودة',          value: stats.drafts,    icon: FileText,    bg: 'var(--surface)', fg: 'var(--text-secondary)' },
            { label: 'قيد المراجعة',   value: stats.submitted, icon: Clock,       bg: 'var(--status-warning-light)', fg: 'var(--status-warning-text)' },
            { label: 'موافق عليه',     value: stats.approved,  icon: CheckCircle, bg: 'var(--status-success-light)', fg: 'var(--status-success-text)' },
            { label: 'مؤرشف',          value: stats.archived,  icon: Archive,     bg: 'var(--status-cancelled-light)', fg: 'var(--status-cancelled-text)' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl p-3.5 flex items-center gap-3" style={{ backgroundColor: s.bg, color: s.fg }}>
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

      {/* Filters */}
      <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value}
              onClick={() => { setStatusFilter(f.value as any); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap font-medium transition',
                statusFilter === f.value && 'text-white',
                statusFilter !== f.value && 'hover:bg-[var(--surface-secondary)]',
              )}
              style={{
                backgroundColor: statusFilter === f.value ? 'var(--primary)' : 'var(--surface)',
                color: statusFilter === f.value ? 'white' : 'var(--text-secondary)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {TYPE_FILTERS.map((f) => (
            <button key={f.value}
              onClick={() => { setTypeFilter(f.value as any); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition',
                typeFilter === f.value && 'text-white',
                typeFilter !== f.value && 'hover:bg-[var(--surface-secondary)]',
              )}
              style={{
                backgroundColor: typeFilter === f.value ? 'var(--primary)' : 'var(--surface)',
                color: typeFilter === f.value ? 'white' : 'var(--text-secondary)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <PageLoader />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="لا توجد تقارير"
          description="لم تُنشأ أي تقارير بعد"
          action={
            <PermissionGate permission="report:create">
              <button
                onClick={() => router.push('/dashboard/reports/new')}
                className="flex items-center gap-2 text-white text-sm px-4 py-2 rounded-lg"
                style={{ backgroundColor: 'var(--primary)' }}>
                <Plus size={14} /> تقرير جديد
              </button>
            </PermissionGate>
          }
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reports.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                onApprove={handleApprove}
                onToggleShare={handleToggleShare}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 hover:bg-[var(--surface-secondary)]"
                style={{ borderColor: 'var(--border)' }}>
                السابق
              </button>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 hover:bg-[var(--surface-secondary)]"
                style={{ borderColor: 'var(--border)' }}>
                التالي
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
