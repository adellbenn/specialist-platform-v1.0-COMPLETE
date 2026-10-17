'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, Shield, Lock, UserCheck,
  CheckCircle, XCircle, MinusCircle, Clock,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useRouteGuard } from '@/components/auth/route-guard';
import { formatDateTime, formatNumber } from '@/lib/utils';
import { getAuditActionLabel, getActorLabel, getAuditEntityLabel } from '@/lib/audit-labels';

type RecStatus = 'ok' | 'todo' | 'off';

export default function SecurityCenterPage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' });
  const [stats, setStats] = useState<any>(null);
  const [permsTotal, setPermsTotal] = useState<number | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes, permsRes] = await Promise.all([
        adminService.getRoleStats(),
        adminService.getAuditLogs({ limit: 10 }),
        adminService.getPermissions(),
      ]);
      setStats(statsRes.data.data);
      setLogs(logsRes.data.data?.slice?.(0, 10) || logsRes.data.data || []);
      setPermsTotal(permsRes.data.data?.length ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const recommendations: { status: RecStatus; msg: string }[] = [
    { status: 'off', msg: 'المصادقة الثنائية للمستخدمين (غير مفعّلة)' },
    {
      status: (stats?.archived || 0) === 0 ? 'ok' : 'todo',
      msg: `مراجعة الأدوار غير النشطة (${formatNumber(stats?.archived || 0)})`,
    },
    {
      status: (stats?.total || 0) > 0 ? 'ok' : 'todo',
      msg: `التحقق من صلاحيات المستخدمين (${formatNumber(stats?.total || 0)} دور)`,
    },
  ];

  if (loading) return <PageSkeleton variant="form" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>مركز الأمان</h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Shield, label: 'الأدوار النشطة', value: stats?.active ?? 0, color: 'var(--success)' },
          { icon: Lock, label: 'إجمالي الصلاحيات', value: permsTotal ?? 0, color: 'var(--primary)' },
          { icon: UserCheck, label: 'الأدوار المؤرشفة', value: stats?.archived ?? 0, color: 'var(--warning)' },
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
                {item.status === 'ok'
                  ? <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                  : item.status === 'todo'
                    ? <XCircle size={14} style={{ color: 'var(--danger)' }} />
                    : <MinusCircle size={14} style={{ color: 'var(--text-muted)' }} />
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
                <div key={log.id || i} className="flex items-start gap-2 text-xs">
                  <Clock size={12} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <span className="min-w-0 flex-1" style={{ color: 'var(--text-primary)' }}>
                    <span className="font-medium">{getAuditActionLabel(log.action)}</span>
                    {' — '}
                    {getActorLabel(log.user)}
                    {log.entityType ? (
                      <span style={{ color: 'var(--text-muted)' }}> • {getAuditEntityLabel(log.entityType)}</span>
                    ) : null}
                  </span>
                  <span className="flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {log.createdAt ? formatDateTime(log.createdAt) : ''}
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
