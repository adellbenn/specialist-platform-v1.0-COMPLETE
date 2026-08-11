'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Appointment, APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS } from '@/types';
import { cn, toDateKey } from '@/lib/utils';

interface CalendarProps {
  appointments: Appointment[];
  byDay: Record<string, Appointment[]>;
  onDayClick?: (date: string, appointments: Appointment[]) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  onMonthChange?: (year: number, month: number) => void;
  initialYear?: number;
  initialMonth?: number;
}

const DAYS_AR = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export function InteractiveCalendar({
  appointments,
  byDay,
  onDayClick,
  onAppointmentClick,
  onMonthChange,
  initialYear,
  initialMonth,
}: CalendarProps) {
  const now = new Date();
  const [year,  setYear]  = useState(initialYear  ?? now.getFullYear());
  const [month, setMonth] = useState(initialMonth ?? now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const todayStr = toDateKey(now);

  // بناء أيام الشهر
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: Array<{ date: string | null; dayNum: number | null }> = [];

    // أيام فارغة قبل أول يوم
    for (let i = 0; i < firstDay; i++) days.push({ date: null, dayNum: null });

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, dayNum: d });
    }

    return days;
  }, [year, month]);

  const goToPrev = () => {
    const newMonth = month === 1 ? 12 : month - 1;
    const newYear  = month === 1 ? year - 1 : year;
    setMonth(newMonth); setYear(newYear);
    onMonthChange?.(newYear, newMonth);
  };

  const goToNext = () => {
    const newMonth = month === 12 ? 1 : month + 1;
    const newYear  = month === 12 ? year + 1 : year;
    setMonth(newMonth); setYear(newYear);
    onMonthChange?.(newYear, newMonth);
  };

  const handleDayClick = (date: string) => {
    setSelectedDay(date === selectedDay ? null : date);
    onDayClick?.(date, byDay[date] ?? []);
  };

  return (
    <div className="bg-background rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <button onClick={goToPrev} aria-label="الشهر السابق" className="p-1.5 rounded-lg hover:bg-surface-secondary transition">
          <ChevronRight size={18} className="text-text-secondary" />
        </button>
        <h2 className="font-bold text-text-primary">
          {MONTHS_AR[month - 1]} {year}
        </h2>
        <button onClick={goToNext} aria-label="الشهر التالي" className="p-1.5 rounded-lg hover:bg-surface-secondary transition">
          <ChevronLeft size={18} className="text-text-secondary" />
        </button>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS_AR.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-text-muted py-2.5">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((cell, idx) => {
          if (!cell.date) {
            return <div key={`empty-${idx}`} className="h-20 border-b border-l border-border" />;
          }

          const dayAppts  = byDay[cell.date] ?? [];
          const isToday   = cell.date === todayStr;
          const isSelected = cell.date === selectedDay;
          const hasPending = dayAppts.some((a) => a.status === 'scheduled');

          return (
            <div
              key={cell.date}
              onClick={() => dayAppts.length > 0 && handleDayClick(cell.date!)}
              className={cn(
                'h-20 border-b border-l border-border p-1.5 transition',
                dayAppts.length > 0 && 'cursor-pointer hover:bg-primary-light',
                isSelected && 'bg-primary-light border-primary',
              )}
            >
              {/* رقم اليوم */}
              <div className={cn(
                'w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full mb-1',
                isToday
                  ? 'bg-primary text-white'
                  : 'text-text-secondary',
              )}>
                {cell.dayNum}
              </div>

              {/* مواعيد اليوم (أول 2) */}
              <div className="space-y-0.5">
                {dayAppts.slice(0, 2).map((a) => (
                  <div
                    key={a.id}
                    onClick={(e) => { e.stopPropagation(); onAppointmentClick?.(a); }}
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80',
                      APPOINTMENT_STATUS_COLORS[a.status],
                    )}
                  >
                    {new Date(a.scheduledAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                    {' '}
                    {a.beneficiary?.firstName}
                  </div>
                ))}
                {dayAppts.length > 2 && (
                  <div className="text-[10px] text-text-muted text-center">
                    +{dayAppts.length - 2} أخرى
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-5 py-3 border-t border-border bg-surface-secondary">
        {(['scheduled', 'confirmed', 'completed', 'cancelled'] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={cn('w-2.5 h-2.5 rounded-full', APPOINTMENT_STATUS_COLORS[s].split(' ')[0])} />
            <span className="text-xs text-text-muted">{APPOINTMENT_STATUS_LABELS[s]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
