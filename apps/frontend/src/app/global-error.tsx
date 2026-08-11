'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
    <html lang="ar" dir="rtl">
      <body className="font-sans antialiased bg-background">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-danger-light mb-4">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--danger)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h1 className="text-h2 font-semibold text-text-primary mb-2">
              حدث خطأ غير متوقع
            </h1>

            <p className="text-body text-text-secondary mb-2">
              عذراً، واجهنا مشكلة غير متوقعة. يرجى المحاولة مرة أخرى.
            </p>

            {error.digest && (
              <p className="text-small text-text-muted font-mono mb-6">
                معرف الخطأ: {error.digest}
              </p>
            )}

            {!error.digest && <div className="mb-6" />}

            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-5 py-2 text-small font-medium text-white rounded-lg transition-all duration-150 bg-primary hover:bg-primary-hover shadow-xs hover:shadow-sm"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
