'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter }   from 'next/navigation';
import { Bell, CheckCheck, Loader2, BellOff } from 'lucide-react';
import toast           from 'react-hot-toast';
import {
  notificationsService,
  AppNotification,
  NotificationsMeta,
} from '@/services/notifications.service';
import { PageLoader }  from '@/components/ui/spinner';
import { timeAgo }     from '@/lib/utils';
import { cn }          from '@/lib/utils';

const TYPE_ICONS: Record<string, string> = {
  appointment_reminder:  '📅',
  session_due:           '⏰',
  report_due:            '📋',
  payment_due:           '💰',
  report_submitted:      '📤',
  report_approved:       '✅',
  new_beneficiary:       '👤',
  subscription_expiring: '⚠️',
  system:                '🔔',
};

export default function NotificationsPage() {
  const router  = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [meta, setMeta]       = useState<NotificationsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [page, setPage]       = useState(1);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsService.getAll(page);
      setNotifications(res.data.data);
      setMeta(res.data.meta);
    } catch {
      toast.error('فشل تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, isRead: true } : n),
      );
    } catch {}
  };

  const handleMarkAllRead = async () => {
    setMarking(true);
    try {
      await notificationsService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (meta) setMeta({ ...meta, unreadCount: 0 });
      toast.success('تم تعليم جميع الإشعارات كمقروءة');
    } catch {
      toast.error('فشل العملية');
    } finally {
      setMarking(false);
    }
  };

  const handleClick = (notif: AppNotification) => {
    if (!notif.isRead) handleMarkRead(notif.id);
    if (notif.link)   router.push(notif.link);
  };

  const totalPages = meta ? Math.ceil(meta.total / 20) : 1;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Bell size={20} style={{ color: 'var(--primary)' }} />
            الإشعارات
          </h1>
          {meta && meta.unreadCount > 0 && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {meta.unreadCount} إشعار غير مقروء
            </p>
          )}
        </div>
        {meta && meta.unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={marking}
            className="flex items-center gap-1.5 text-sm disabled:opacity-60 transition"
            style={{ color: 'var(--primary)' }}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.color = 'var(--primary-hover)'; }}
            onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.color = 'var(--primary)'; }}
          >
            {marking
              ? <Loader2 size={14} className="animate-spin" />
              : <CheckCheck size={14} />}
            تعليم الكل كمقروء
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <PageLoader />
      ) : notifications.length === 0 ? (
        <div className="bg-[var(--background)] rounded-xl border p-12 text-center" style={{ borderColor: 'var(--border)' }}>
          <BellOff size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>لا توجد إشعارات</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>ستظهر هنا الإشعارات الجديدة</p>
        </div>
      ) : (
        <div className="bg-[var(--background)] rounded-xl border divide-y overflow-hidden"
          style={{ borderColor: 'var(--border)', '--tw-divide-color': 'var(--border)' } as React.CSSProperties}>
          {notifications.map((notif) => (
            <button
              type="button"
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={cn(
                'flex w-full text-right items-start gap-3 p-4 transition cursor-pointer',
                !notif.isRead ? 'hover:bg-[var(--surface-secondary)]' : 'hover:bg-[var(--surface)]',
              )}
              style={!notif.isRead ? { backgroundColor: 'var(--primary-light)' } : undefined}
            >
              {/* أيقونة النوع */}
              <div className="text-xl flex-shrink-0 mt-0.5">
                {TYPE_ICONS[notif.type] ?? '🔔'}
              </div>

              {/* المحتوى */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn(
                    'text-sm leading-snug',
                    !notif.isRead ? 'font-semibold' : '',
                  )}
                  style={{ color: !notif.isRead ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {notif.title}
                  </p>
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: 'var(--primary)' }} />
                  )}
                </div>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{notif.message}</p>
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{timeAgo(notif.createdAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 hover:bg-[var(--surface)]"
          >
            السابق
          </button>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 hover:bg-[var(--surface)]"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}
