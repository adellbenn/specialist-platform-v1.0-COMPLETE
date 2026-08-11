'use client';

import { Globe } from 'lucide-react';

export default function languagePage() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <Globe size={40} style={{ color: 'var(--text-muted)' }} className="mb-3" />
      <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>اللغة والمنطقة</h2>
      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>قريباً</p>
    </div>
  );
}
