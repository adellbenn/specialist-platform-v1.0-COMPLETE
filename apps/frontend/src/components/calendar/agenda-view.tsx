'use client';

import { useMemo } from 'react';
import { Appointment, CALENDAR_DEFAULT_COLORS, APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS } from '@/types';
import { isoToDateKey } from '@/lib/utils';

interface AgendaViewProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
}

export function AgendaView({ appointments, onAppointmentClick }: AgendaViewProps) {
  const grouped = useMemo(() => {
    const g: Record<string, Appointment[]> = {};
    const sorted = [...appointments].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    for (const a of sorted) {
      const key = isoToDateKey(a.scheduledAt);
      if (!g[key]) g[key] = [];
      g[key].push(a);
    }
    return g;
  }, [appointments]);

  const formatDateAr = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ar', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (Object.keys(grouped).length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        <p>لا توجد مواعيد في هذه الفترة</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl" style={{ border: '1px solid var(--border)' }}>
      {Object.entries(grouped).map(([date, appts]) => (
        <div key={date}>
          <div className="sticky top-0 p-3 text-xs font-bold" style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            {formatDateAr(date)}
            <span className="mr-2" style={{ color: 'var(--text-muted)' }}>({appts.length})</span>
          </div>
          {appts.map((a) => {
            const sColors = CALENDAR_DEFAULT_COLORS.status[a.status];
            const tColors = a.type ? CALENDAR_DEFAULT_COLORS.type[a.type] : null;
            const time = new Date(a.scheduledAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
            return (
              <button type="button" key={a.id} onClick={() => onAppointmentClick(a)}
                aria-label={`${a.beneficiary?.firstName ?? ''} ${a.beneficiary?.lastName ?? ''} ${time}`}
                className="w-full p-3 flex items-center gap-3 cursor-pointer hover:bg-[var(--surface)] transition text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="text-center shrink-0">
                  <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{time}</div>
                </div>
                <div className="w-0.5 h-8 rounded-full" style={{ backgroundColor: sColors.dot }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {a.beneficiary?.firstName} {a.beneficiary?.lastName}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: sColors.bg, color: sColors.text }}>
                      {APPOINTMENT_STATUS_LABELS[a.status]}
                    </span>
                    {a.type && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: tColors?.bg, color: tColors?.text }}>
                        {APPOINTMENT_TYPE_LABELS[a.type]}
                      </span>
                    )}
                  </div>
                </div>
                {a.durationMinutes && (
                  <div className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {a.durationMinutes} د
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
