'use client';

import { Calendar } from 'lucide-react';

export default function calendarPage() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <Calendar size={40} style={{ color: 'var(--text-muted)' }} className="mb-3" />
      <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>التقويم</h2>
      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>قريباً</p>
    </div>
  );
}
