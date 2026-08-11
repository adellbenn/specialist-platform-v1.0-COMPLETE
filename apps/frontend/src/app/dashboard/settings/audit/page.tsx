'use client';

import { FileText } from 'lucide-react';

export default function auditPage() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <FileText size={40} style={{ color: 'var(--text-muted)' }} className="mb-3" />
      <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>سجل التدقيق</h2>
      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>قريباً</p>
    </div>
  );
}
