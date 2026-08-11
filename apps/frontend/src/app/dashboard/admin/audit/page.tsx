'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Search, Filter, RefreshCw, Clock, User, Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

export default function AuditPage() {
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
    !search || l.user?.name?.includes(search) || l.details?.includes(search) || l.entityId?.includes(search),
  );

  const getActionColor = (action: string) => {
    if (action?.startsWith('create')) return 'var(--success)';
    if (action?.startsWith('delete')) return 'var(--danger)';
    if (action?.startsWith('update')) return 'var(--warning)';
    return 'var(--primary)';
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create_role': return 'إنشاء دور';
      case 'update_role': return 'تحديث دور';
      case 'delete_role': return 'حذف دور';
      case 'assign_permissions': return 'تعيين صلاحيات';
      case 'bulk_assign': return 'تعيين جماعي';
      case 'set_override': return 'تجاوز صلاحية';
      case 'seed_done': return 'بذر صلاحيات';
      case 'archive_role': return 'أرشفة دور';
      case 'duplicate_role': return 'نسخ دور';
      case 'compare_roles': return 'مقارنة أدوار';
      default: return action;
    }
  };

  if (loading) return <PageLoader />;

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
          <option value="create_role">إنشاء</option>
          <option value="update_role">تحديث</option>
          <option value="delete_role">حذف</option>
          <option value="assign_permissions">تعيين صلاحيات</option>
          <option value="set_override">تجاوز</option>
        </select>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}
          className="text-sm rounded-xl px-3 py-2 focus:outline-none"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
          <option value="">كل الكيانات</option>
          <option value="role">دور</option>
          <option value="permission">صلاحية</option>
          <option value="user_permission">مستخدم</option>
          <option value="permission_group">مجموعة</option>
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
                    {getActionBadge(log.action)}
                  </span>
                  {log.action === 'delete_role' && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>•</span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    <User size={10} className="inline ml-1" />
                    {log.user?.name || 'النظام'}
                  </span>
                </div>
                <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {log.details || `${getActionBadge(log.action)} — ${log.entityType} #${log.entityId}`}
                </p>
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <Clock size={10} />
                  {new Date(log.createdAt).toLocaleString('ar-SA')}
                  {log.metadata && (
                    <>
                      <span>•</span>
                      {JSON.stringify(log.metadata).substring(0, 60)}
                    </>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
