'use client';

import { useMemo } from 'react';
import { Appointment, CALENDAR_DEFAULT_COLORS } from '@/types';
import { cn, toDateKey } from '@/lib/utils';

interface MonthViewProps {
  currentDate: Date;
  byDay: Record<string, Appointment[]>;
  onDayClick: (date: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

const DAYS_AR = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export function MonthView({ currentDate, byDay, onDayClick, onAppointmentClick }: MonthViewProps) {
  const todayStr = toDateKey(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: Array<{ date: string | null; dayNum: number | null }> = [];
    for (let i = 0; i < firstDay; i++) days.push({ date: null, dayNum: null });
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`, dayNum: d });
    }
    return days;
  }, [year, month]);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="grid grid-cols-7">
        {DAYS_AR.map((d) => (
          <div key={d} className="text-center text-xs font-medium py-2.5" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calendarDays.map((cell, idx) => {
          if (!cell.date) {
            return <div key={`e-${idx}`} className="min-h-[100px]" style={{ borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }} />;
          }
          const dayAppts = byDay[cell.date] ?? [];
          const isToday = cell.date === todayStr;

          return (
            <div key={cell.date!}
              onClick={() => onDayClick(cell.date!)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onDayClick(cell.date!);
                }
              }}
              className="min-h-[100px] p-1.5 cursor-pointer transition hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              style={{ borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
              <div className={cn('w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full mb-1', isToday && 'text-white')}
                style={{ backgroundColor: isToday ? 'var(--primary)' : 'transparent', color: isToday ? '#fff' : 'var(--text-primary)' }}>
                {cell.dayNum}
              </div>
              <div className="space-y-0.5">
                {dayAppts.slice(0, 3).map((a) => {
                  const colors = CALENDAR_DEFAULT_COLORS.status[a.status];
                  return (
                    <button type="button" key={a.id}
                      onClick={(e) => { e.stopPropagation(); onAppointmentClick(a); }}
                      aria-label={`${a.beneficiary?.firstName ?? ''} ${a.beneficiary?.lastName ?? ''} ${new Date(a.scheduledAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}`}
                      className="w-full text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      style={{ backgroundColor: colors.bg, color: colors.text }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: colors.dot }} />
                      {new Date(a.scheduledAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                      {' '}{a.beneficiary?.firstName}
                    </button>
                  );
                })}
                {dayAppts.length > 3 && (
                  <div className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
                    +{dayAppts.length - 3}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
