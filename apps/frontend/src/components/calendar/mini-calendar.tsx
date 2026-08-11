'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn, toDateKey } from '@/lib/utils';

interface MiniCalendarProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  appointmentDays?: Set<string>;
}

const DAYS_AR = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export function MiniCalendar({ currentDate, onDateSelect, appointmentDays }: MiniCalendarProps) {
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const todayStr = toDateKey(new Date());

  const days = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const result: Array<{ date: string | null; dayNum: number | null }> = [];
    for (let i = 0; i < firstDay; i++) result.push({ date: null, dayNum: null });
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({ date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`, dayNum: d });
    }
    return result;
  }, [year, month]);

  const goToPrev = () => { if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1); };
  const goToNext = () => { if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1); };

  const selectDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    onDateSelect(new Date(y, m - 1, d));
  };

  return (
    <div className="rounded-xl p-3" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={goToPrev} className="p-1 rounded hover:bg-[var(--surface)] transition">
          <ChevronRight size={14} />
        </button>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          {MONTHS_AR[month - 1]} {year}
        </span>
        <button onClick={goToNext} className="p-1 rounded hover:bg-[var(--surface)] transition">
          <ChevronLeft size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {DAYS_AR.map((d) => (
          <div key={d} className="text-center text-[10px] py-1" style={{ color: 'var(--text-muted)' }}>{d}</div>
        ))}
        {days.map((cell, idx) => {
          if (!cell.date) return <div key={`e-${idx}`} />;
          const isToday = cell.date === todayStr;
          const isSelected = cell.date === toDateKey(currentDate);
          const hasAppt = appointmentDays?.has(cell.date);
          return (
            <button key={cell.date} onClick={() => selectDate(cell.date!)}
              className={cn(
                'text-[11px] w-7 h-7 rounded-full flex items-center justify-center mx-auto transition relative',
                isSelected ? 'text-white' : isToday ? 'font-bold' : 'hover:bg-[var(--surface)]',
              )}
              style={{
                backgroundColor: isSelected ? 'var(--primary)' : isToday ? 'var(--surface)' : 'transparent',
                color: isSelected ? '#fff' : 'var(--text-primary)',
              }}>
              {cell.dayNum}
              {hasAppt && !isSelected && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
