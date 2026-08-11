'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--danger-light)' }}>
        <span className="text-2xl" style={{ color: 'var(--danger)' }}>!</span>
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>حدث خطأ</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
      </p>
      <button
        onClick={reset}
        className="px-6 py-2.5 text-sm font-medium text-white rounded-2xl transition hover:brightness-90"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
