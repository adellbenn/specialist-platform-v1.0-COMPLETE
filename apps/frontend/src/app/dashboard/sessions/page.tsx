'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Clock, User, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { PermissionGate } from '@/components/auth/permission-gate';
import { Badge } from '@/components/ui/badge';
import { useRouteGuard } from '@/components/auth/route-guard';
import apiClient from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';

interface SessionItem {
  id: string;
  beneficiaryId: string;
  specialistId: string;
  appointmentId?: string;
  status: string;
  attendance: string;
  startedAt: string;
  endedAt?: string;
  notes?: string;
  beneficiary?: { id: string; firstName: string; lastName: string; fileNumber: string };
  specialist?: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

const ATTENDANCE_LABELS: Record<string, { label: string; color: string }> = {
  present:  { label: 'حاضر',     color: 'var(--success)' },
  absent:   { label: 'غائب',     color: 'var(--danger)' },
  excused:  { label: 'معذر',     color: 'var(--warning)' },
  late:     { label: 'متأخر',    color: 'var(--warning)' },
};

export default function SessionsPage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager', 'supervisor', 'specialist'], redirectTo: '/dashboard' });
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      const res = await apiClient.get<{ data: SessionItem[]; meta: { total: number } }>(`/sessions?${params}`);
      setSessions(res.data.data);
      setTotal(res.data.meta?.total ?? 0);
    } catch {
      toast.error('فشل تحميل الجلسات');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
            <FileText size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>الجلسات</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{total} جلسة</p>
          </div>
        </div>
        <PermissionGate permission="session:create">
          <button onClick={() => router.push('/dashboard/sessions/new')}
            className="flex items-center gap-1.5 text-white text-sm px-4 py-2 rounded-lg transition"
            style={{ backgroundColor: 'var(--primary)' }}>
            <Plus size={14} /> جلسة جديدة
          </button>
        </PermissionGate>
      </div>

      {loading ? (
        <PageLoader />
      ) : sessions.length === 0 ? (
        <EmptyState icon={FileText} title="لا توجد جلسات" description="لم يتم تسجيل أي جلسات بعد"
          action={
        <PermissionGate permission="session:create">
              <button onClick={() => router.push('/dashboard/sessions/new')}
                className="flex items-center gap-2 text-white text-sm px-4 py-2 rounded-lg"
                style={{ backgroundColor: 'var(--primary)' }}>
                <Plus size={14} /> تسجيل جلسة
              </button>
            </PermissionGate>
          }
        />
      ) : (
        <>
          <div className="grid gap-3">
            {sessions.map((s) => {
              const att = ATTENDANCE_LABELS[s.attendance] ?? { label: s.attendance, color: 'var(--text-secondary)' };
              return (
                <div key={s.id}
                  className="rounded-xl p-4 transition hover:shadow-card-hover cursor-pointer"
                  style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                  onClick={() => router.push(`/dashboard/sessions/${s.id}`)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {s.beneficiary?.firstName} {s.beneficiary?.lastName}
                        </span>
                        {s.beneficiary?.fileNumber && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
                            {s.beneficiary.fileNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {s.specialist?.firstName} {s.specialist?.lastName}
                        </span>
                        <span>{formatDateTime(s.startedAt)}</span>
                      </div>
                    </div>
                    <Badge label={att.label} style={{ backgroundColor: att.color, color: 'white' }} />
                  </div>
                  {s.notes && (
                    <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                      {s.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 hover:bg-[var(--surface-secondary)]"
                style={{ borderColor: 'var(--border)' }}>السابق</button>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 hover:bg-[var(--surface-secondary)]"
                style={{ borderColor: 'var(--border)' }}>التالي</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
