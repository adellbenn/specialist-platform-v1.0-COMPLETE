'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, Shield, Key, Users, Activity,
  CheckCircle, XCircle, Clock, FileText, UserCheck, UserX, Lock,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { PageLoader } from '@/components/ui/spinner';

export default function SecurityCenterPage() {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        adminService.getRoleStats(),
        adminService.getAuditLogs(),
      ]);
      setStats(statsRes.data.data);
      setLogs(logsRes.data.data?.slice?.(0, 10) || logsRes.data.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const recommendations = [
    { ok: true, msg: 'تمكين المصادقة الثنائية للمستخدمين' },
    { ok: true, msg: 'تسجيل جميع أحداث الصلاحيات' },
    {
      ok: (stats?.archived || 0) === 0,
      msg: `مراجعة الأدوار غير النشطة (${stats?.archived || 0})`,
    },
    {
      ok: (stats?.total || 0) > 0,
      msg: `التحقق من صلاحيات المستخدمين (${stats?.total || 0} دور)`,
    },
    {
      ok: (stats?.system || 0) >= 3,
      msg: `تحديث صلاحيات الأدوار القديمة (${stats?.system || 0} دور نظامي)`,
    },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>مركز الأمان</h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Shield, label: 'الأدوار النشطة', value: stats?.active ?? 0, color: 'var(--success)' },
          { icon: Lock, label: 'إجمالي الصلاحيات', value: stats?.withPermissions ?? 0, color: 'var(--primary)' },
          { icon: UserCheck, label: 'الأدوار المؤرشفة', value: stats?.archived ?? 0, color: 'var(--warning)' },
          { icon: UserX, label: 'الأدوار النظامية', value: stats?.system ?? 0, color: 'var(--info)' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-5" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={16} style={{ color: s.color }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>توصيات الأمان</h3>
          <ul className="space-y-2">
            {recommendations.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {item.ok
                  ? <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                  : <XCircle size={14} style={{ color: 'var(--danger)' }} />
                }
                {item.msg}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>آخر الأحداث</h3>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>لا توجد أحداث مسجلة بعد</p>
            ) : (
              logs.map((log: any, i: number) => (
                <div key={log.id || i} className="flex items-center gap-2 text-xs">
                  <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-primary)' }}>{log.details || log.action}</span>
                  <span className="mr-auto" style={{ color: 'var(--text-muted)' }}>
                    {log.createdAt ? new Date(log.createdAt).toLocaleDateString('ar-SA') : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
