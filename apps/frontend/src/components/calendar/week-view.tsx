'use client';

import { useMemo } from 'react';
import { Appointment, CALENDAR_DEFAULT_COLORS } from '@/types';
import { cn, toDateKey, isoToDateKey } from '@/lib/utils';

interface WeekViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);
const DAYS_AR = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export function WeekView({ currentDate, appointments, onAppointmentClick }: WeekViewProps) {
  const todayStr = toDateKey(new Date());

  const weekDays = useMemo(() => {
    const day = currentDate.getDay();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - day + i);
      const dateStr = toDateKey(d);
      return { date: dateStr, dayNum: d.getDate(), dayName: DAYS_AR[d.getDay()], isToday: dateStr === todayStr };
    });
  }, [currentDate, todayStr]);

  const getAppointmentsForCell = (dateStr: string, hour: number) => {
    return appointments.filter((a) => {
      const aDate = isoToDateKey(a.scheduledAt);
      const aHour = new Date(a.scheduledAt).getHours();
      return aDate === dateStr && aHour === hour;
    });
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="grid grid-cols-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="p-2 text-[10px] font-medium text-center" style={{ color: 'var(--text-muted)' }}>الوقت</div>
        {weekDays.map((wd) => (
          <div key={wd.date} className={cn('p-2 text-center', wd.isToday && 'rounded-lg')}
            style={{ backgroundColor: wd.isToday ? 'var(--primary-50)' : 'transparent', color: 'var(--text-primary)' }}>
            <div className="text-[10px] font-medium">{wd.dayName}</div>
            <div className="text-sm font-bold">{wd.dayNum}</div>
          </div>
        ))}
      </div>
      <div className="overflow-y-auto max-h-[600px]">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-8" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="p-2 text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
              {hour.toString().padStart(2, '0')}:00
            </div>
            {weekDays.map((wd) => {
              const cellAppts = getAppointmentsForCell(wd.date, hour);
              return (
                <div key={wd.date} className="min-h-[60px] p-0.5 relative" style={{ borderLeft: '1px solid var(--border)' }}>
                  {cellAppts.map((a) => {
                    const colors = CALENDAR_DEFAULT_COLORS.status[a.status];
                    const duration = a.durationMinutes || 60;
                    const height = Math.max(24, (duration / 60) * 56);
                    return (
                      <button type="button" key={a.id} onClick={() => onAppointmentClick(a)}
                        aria-label={`${a.beneficiary?.firstName ?? ''} ${a.beneficiary?.lastName ?? ''} ${new Date(a.scheduledAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}`}
                        className="w-full text-[10px] px-1 py-0.5 rounded cursor-pointer hover:opacity-80 truncate mb-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                        style={{ backgroundColor: colors.bg, color: colors.text, height: `${height}px` }}>
                        <span className="font-semibold">{a.beneficiary?.firstName}</span>
                        <br />
                        {new Date(a.scheduledAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
