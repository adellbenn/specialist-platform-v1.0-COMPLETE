'use client';

import { useMemo } from 'react';
import { Appointment, CALENDAR_DEFAULT_COLORS } from '@/types';
import { cn, toDateKey, isoToDateKey } from '@/lib/utils';

interface DayViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

export function DayView({ currentDate, appointments, onAppointmentClick }: DayViewProps) {
  const todayStr = toDateKey(new Date());
  const dateStr = toDateKey(currentDate);
  const isToday = dateStr === todayStr;

  const dayAppointments = useMemo(() => {
    return appointments.filter((a) => isoToDateKey(a.scheduledAt) === dateStr);
  }, [appointments, dateStr]);

  const getApptsForHour = (hour: number) => {
    return dayAppointments.filter((a) => new Date(a.scheduledAt).getHours() === hour);
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className={cn('p-3 text-center text-sm font-bold', isToday && 'rounded-lg')}
        style={{ backgroundColor: isToday ? 'var(--primary-50)' : 'transparent', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
        {currentDate.toLocaleDateString('ar', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      <div className="overflow-y-auto max-h-[700px]">
        {HOURS.map((hour) => {
          const appts = getApptsForHour(hour);
          return (
            <div key={hour} className="flex" style={{ borderBottom: '1px solid var(--border)', minHeight: '64px' }}>
              <div className="w-16 shrink-0 p-2 text-[10px] text-center flex items-start justify-center pt-3"
                style={{ color: 'var(--text-muted)', borderLeft: '1px solid var(--border)' }}>
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 p-1">
                {appts.length === 0 && (
                  <div className="text-[10px] p-2" style={{ color: 'var(--text-muted)' }}>—</div>
                )}
                {appts.map((a) => {
                  const colors = CALENDAR_DEFAULT_COLORS.status[a.status];
                  const time = new Date(a.scheduledAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <button type="button" key={a.id} onClick={() => onAppointmentClick(a)}
                      aria-label={`${a.beneficiary?.firstName ?? ''} ${a.beneficiary?.lastName ?? ''} ${time}`}
                      className="w-full p-2 rounded-lg cursor-pointer hover:opacity-80 mb-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      style={{ backgroundColor: colors.bg, color: colors.text }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{a.beneficiary?.firstName} {a.beneficiary?.lastName}</span>
                        <span className="text-[10px]">{time}</span>
                      </div>
                      <div className="text-[10px] flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.dot }} />
                        {a.status} {a.type && `· ${a.type}`}
                      </div>
                      {a.durationMinutes && (
                        <div className="text-[10px] mt-0.5">{a.durationMinutes} دقيقة</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
