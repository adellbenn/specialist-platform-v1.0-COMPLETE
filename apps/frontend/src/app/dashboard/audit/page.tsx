'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Filter, Download } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useRouteGuard } from '@/components/auth/route-guard';
import { formatDateTime, cn, toDateKey } from '@/lib/utils';

interface AuditLogEntry {
  id:          string;
  userId:      string | null;
  user?:       { firstName: string; lastName: string; email: string } | null;
  action:      string;
  entityType:  string;
  entityId:    string | null;
  description: string | null;
  ipAddress:   string | null;
  createdAt:   string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE:  'bg-[var(--status-info-light)] text-[var(--status-info-text)]',
  UPDATE:  'bg-[var(--status-scheduled-light)] text-[var(--status-scheduled-text)]',
  DELETE:  'bg-[var(--danger-light)] text-[var(--danger)]',
  LOGIN:   'bg-[var(--status-completed-light)] text-[var(--status-completed-text)]',
  LOGOUT:  'bg-[var(--surface-secondary)] text-[var(--text-secondary)]',
  EXPORT:  'bg-[var(--status-warning-light)] text-[var(--status-warning-text)]',
  APPROVE: 'bg-[var(--status-success-light)] text-[var(--status-success-text)]',
  SUBMIT:  'bg-[var(--danger-light)] text-[var(--danger)]',
  READ:    'bg-[var(--surface)] text-[var(--text-muted)]',
};

const ENTITY_LABELS: Record<string, string> = {
  beneficiary:   'مستفيد',
  appointment:   'موعد',
  session:       'جلسة',
  report:        'تقرير',
  invoice:       'فاتورة',
  subscription:  'اشتراك',
  user:          'مستخدم',
  tenant:        'مركز',
};

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'APPROVE', 'SUBMIT'];

export default function AuditLogPage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager', 'supervisor'], redirectTo: '/dashboard' });

  const [logs, setLogs]         = useState<AuditLogEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [actionFilter, setActionFilter]   = useState('');
  const [entityFilter, setEntityFilter]   = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '30',
        ...(actionFilter && { action: actionFilter }),
        ...(entityFilter && { entityType: entityFilter }),
        ...(dateFrom     && { dateFrom }),
        ...(dateTo       && { dateTo }),
      });
      const res = await apiClient.get<{ data: AuditLogEntry[]; meta: any }>(
        `/audit-logs?${params}`,
      );
      setLogs(res.data.data);
      setTotal(res.data.meta?.total ?? 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [actionFilter, entityFilter, dateFrom, dateTo]);

  const handleExport = async () => {
    try {
      const res = await apiClient.get('/audit-logs?limit=1000');
      const logs: AuditLogEntry[] = res.data.data;
      const header = 'الوقت,المستخدم,العملية,الكيان,معرف الكيان,الوصف,IP';
      const rows = logs.map((l) => {
        const user = l.user ? `${l.user.firstName} ${l.user.lastName}` : '—';
        return [
          l.createdAt,
          `"${user}"`,
          l.action,
          l.entityType,
          l.entityId ?? '',
          `"${(l.description ?? '').replace(/"/g, '""')}"`,
          l.ipAddress ?? '',
        ].join(',');
      });
      const bom = '\uFEFF';
      const csv = bom + header + '\n' + rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${toDateKey(new Date())}.csv`;
      a.click();
    } catch {}
  };

  const totalPages = Math.ceil(total / 30);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Shield size={20} style={{ color: 'var(--primary)' }} />
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>سجل النشاطات</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {total} سجل نشاط
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-secondary)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          <Download size={14} /> تصدير
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Filter size={15} style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>الفلاتر</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-sm rounded-lg px-3 py-2 focus:outline-none"
            style={{ borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}
          >
            <option value="">جميع العمليات</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="text-sm rounded-lg px-3 py-2 focus:outline-none"
            style={{ borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}
          >
            <option value="">جميع الكيانات</option>
            {Object.entries(ENTITY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-sm rounded-lg px-3 py-2 focus:outline-none"
            style={{ borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}
            placeholder="من تاريخ"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-sm rounded-lg px-3 py-2 focus:outline-none"
            style={{ borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}
            placeholder="إلى تاريخ"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <PageLoader />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="لا توجد سجلات"
          description="لا توجد نشاطات مسجلة بالمعايير المحددة"
        />
      ) : (
        <>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <tr>
                    {['الوقت', 'المستخدم', 'العملية', 'الكيان', 'الوصف', 'IP'].map((h) => (
                      <th key={h} className="text-right text-xs font-medium py-3 px-4" style={{ color: 'var(--text-secondary)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {logs.map((log) => (
                    <tr key={log.id} className="transition"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-secondary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td className="py-3 px-4 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        {log.user ? (
                          <div>
                            <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                              {log.user.firstName} {log.user.lastName}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{log.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          ACTION_COLORS[log.action] ?? '',
                        )} style={!ACTION_COLORS[log.action] ? { backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' } : undefined}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {ENTITY_LABELS[log.entityType] ?? log.entityType}
                        {log.entityId && (
                          <p className="font-mono text-[10px] mt-0.5 truncate max-w-[80px]" style={{ color: 'var(--text-muted)' }}>
                            {log.entityId.slice(0, 8)}...
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                        {log.description ?? '—'}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {log.ipAddress ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40"
                style={{ borderColor: 'var(--border)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                السابق
              </button>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40"
                style={{ borderColor: 'var(--border)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                التالي
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
