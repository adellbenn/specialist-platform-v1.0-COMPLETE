'use client';

import { ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { CalendarView } from '@/types';
import { useCalendar } from './calendar-context';
import { cn } from '@/lib/utils';

const VIEW_OPTIONS: Array<{ value: CalendarView; label: string }> = [
  { value: 'month', label: 'شهري' },
  { value: 'week', label: 'أسبوعي' },
  { value: 'day', label: 'يومي' },
  { value: 'agenda', label: 'قائمة' },
];

export function CalendarToolbar() {
  const { view, setView, goNext, goPrev, goToday, currentDate, openNewAppointment } = useCalendar();

  const titleText = (() => {
    if (view === 'month') return currentDate.toLocaleDateString('ar', { year: 'numeric', month: 'long' });
    if (view === 'week') {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay());
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
      return `${start.toLocaleDateString('ar', { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString('ar', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (view === 'day') return currentDate.toLocaleDateString('ar', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return currentDate.toLocaleDateString('ar', { year: 'numeric', month: 'long' });
  })();

  return (
    <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
      <div className="flex items-center gap-2">
        <button onClick={goPrev} aria-label="السابق" className="p-2 rounded-lg hover:bg-[var(--surface)] transition" style={{ border: '1px solid var(--border)' }}>
          <ChevronRight size={18} />
        </button>
        <button onClick={goNext} aria-label="التالي" className="p-2 rounded-lg hover:bg-[var(--surface)] transition" style={{ border: '1px solid var(--border)' }}>
          <ChevronLeft size={18} />
        </button>
        <button onClick={goToday} className="px-3 py-1.5 text-sm rounded-lg hover:bg-[var(--surface)] transition font-medium"
          style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
          اليوم
        </button>
        <h2 className="text-base font-bold mr-2" style={{ color: 'var(--text-primary)' }}>{titleText}</h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {VIEW_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setView(opt.value)}
              className={cn('px-3 py-1.5 text-xs font-medium transition')}
              style={{
                backgroundColor: view === opt.value ? 'var(--primary)' : 'var(--background)',
                color: view === opt.value ? '#fff' : 'var(--text-primary)',
              }}>
              {opt.label}
            </button>
          ))}
        </div>
        <button onClick={() => openNewAppointment()}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg text-white font-medium"
          style={{ backgroundColor: 'var(--primary)' }}>
          <Plus size={16} /> موعد جديد
        </button>
      </div>
    </div>
  );
}
