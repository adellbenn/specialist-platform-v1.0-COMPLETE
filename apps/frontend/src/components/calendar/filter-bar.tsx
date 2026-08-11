'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { AppointmentStatus, AppointmentType } from '@/types';
import { useCalendar } from './calendar-context';

const STATUS_FILTERS: Array<{ value: AppointmentStatus | 'all'; label: string }> = [
  { value: 'all', label: 'الكل' },
  { value: 'scheduled', label: 'مجدول' },
  { value: 'confirmed', label: 'مؤكد' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغي' },
  { value: 'no_show', label: 'لم يحضر' },
];

const TYPE_FILTERS: Array<{ value: AppointmentType | 'all'; label: string }> = [
  { value: 'all', label: 'الكل' },
  { value: 'initial', label: 'استشارة أولى' },
  { value: 'follow_up', label: 'متابعة' },
  { value: 'assessment', label: 'تقييم' },
  { value: 'group', label: 'جلسة جماعية' },
];

export function FilterBar() {
  const { filters, setFilters, clearFilters } = useCalendar();
  const [open, setOpen] = useState(false);
  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <button onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition"
          style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
          <Filter size={14} />
          تصفية
          {hasActiveFilters && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />}
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <X size={12} /> إزالة
          </button>
        )}
      </div>

      {open && (
        <div className="flex items-center gap-3 mt-2 flex-wrap p-3 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
          <div>
            <label className="block text-[10px] mb-0.5" style={{ color: 'var(--text-muted)' }}>الحالة</label>
            <select value={filters.status || 'all'} onChange={(e) => {
              const val = e.target.value as AppointmentStatus | 'all';
              setFilters((prev) => {
                const next = { ...prev };
                if (val === 'all') delete next.status;
                else next.status = val;
                return next;
              });
            }}
              className="px-2 py-1 text-xs rounded"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
              {STATUS_FILTERS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] mb-0.5" style={{ color: 'var(--text-muted)' }}>النوع</label>
            <select value={filters.type || 'all'} onChange={(e) => {
              const val = e.target.value as AppointmentType | 'all';
              setFilters((prev) => {
                const next = { ...prev };
                if (val === 'all') delete next.type;
                else next.type = val;
                return next;
              });
            }}
              className="px-2 py-1 text-xs rounded"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
              {TYPE_FILTERS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] mb-0.5" style={{ color: 'var(--text-muted)' }}>الموقع</label>
            <input value={filters.location || ''} onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              placeholder="الموقع"
              className="px-2 py-1 text-xs rounded"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }} />
          </div>
        </div>
      )}
    </div>
  );
}
