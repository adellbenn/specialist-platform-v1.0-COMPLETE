'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Search, Filter, RefreshCw, Clock, User, Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useRouteGuard } from '@/components/auth/route-guard';
import { cn, formatDateTime } from '@/lib/utils';
import { getAuditActionLabel, getActorLabel, getAuditEntityLabel } from '@/lib/audit-labels';

const ACTION_OPTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];
const ENTITY_OPTIONS = ['Role', 'PermissionGroup', 'UserPermission', 'Auth'];

export default function AuditPage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' });
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entityType = entityFilter;
      const res = await adminService.getAuditLogs(params);
      setLogs(res.data.data);
    } catch {
      toast.error('فشل تحميل سجل الأمان');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter((l) =>
    !search ||
    getActorLabel(l.user).includes(search) ||
    l.user?.email?.includes(search) ||
    l.description?.includes(search) ||
    l.entityId?.includes(search),
  );

  const getActionColor = (action: string) => {
    const a = action?.toUpperCase();
    if (a === 'CREATE') return 'var(--success)';
    if (a === 'DELETE') return 'var(--danger)';
    if (a === 'UPDATE') return 'var(--warning)';
    return 'var(--primary)';
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={20} style={{ color: 'var(--primary)' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>سجل الأمان</h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
            {logs.length} إجراء
          </span>
        </div>
        <button onClick={fetchLogs}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition hover:bg-[var(--surface)]"
          style={{ color: 'var(--text-secondary)' }}>
          <RefreshCw size={13} /> تحديث
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="بحث في السجل..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm rounded-xl pr-9 px-3 py-2 focus:outline-none focus:ring-2"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }} />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          className="text-sm rounded-xl px-3 py-2 focus:outline-none"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
          <option value="">كل الإجراءات</option>
          {ACTION_OPTIONS.map((a) => (
            <option key={a} value={a}>{getAuditActionLabel(a)}</option>
          ))}
        </select>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}
          className="text-sm rounded-xl px-3 py-2 focus:outline-none"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
          <option value="">كل الكيانات</option>
          {ENTITY_OPTIONS.map((e) => (
            <option key={e} value={e}>{getAuditEntityLabel(e)}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Activity} title="لا توجد أحداث" description="لم يتم تسجيل أي أحداث أمان بعد" />
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => (
            <div key={log.id}
              className="rounded-xl p-4 flex items-start gap-3 transition hover:shadow-sm"
              style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${getActionColor(log.action)}15` }}>
                <Activity size={14} style={{ color: getActionColor(log.action) }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: `${getActionColor(log.action)}15`, color: getActionColor(log.action) }}>
                    {getAuditActionLabel(log.action)}
                  </span>
                  {log.entityType && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      • {getAuditEntityLabel(log.entityType)}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    <User size={10} className="inline ml-1" />
                    {getActorLabel(log.user)}
                  </span>
                </div>
                <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {log.description || `${getAuditActionLabel(log.action)} — ${getAuditEntityLabel(log.entityType)}${log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}`}
                </p>
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <Clock size={10} />
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
