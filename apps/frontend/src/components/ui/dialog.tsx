'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  /** حالة الفتح/الإغلاق */
  open: boolean;
  /** استدعاء عند طلب الإغلاق (Escape، النقر على الخلفية، زر ×) */
  onClose: () => void;
  /** عنوان الحوار */
  title?: string;
  /** وصف/عنوان فرعي */
  subtitle?: string;
  /** حجم الحوار */
  size?: DialogSize;
  /** إظهار زر الإغلاق (×) أعلى يسار */
  showCloseButton?: boolean;
  /** تذييل الحوار (الأزرار عادةً) */
  footer?: ReactNode;
  /** عرض ضيّق داخل صفحة dashboard (بدون شريط title كبير) */
  compact?: boolean;
  /** محتوى المنتصف */
  children: ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  showCloseButton = true,
  footer,
  compact,
  children,
}: DialogProps) {
  const titleId = useId();
  const descId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  /* قفل تمرير الخلفية أثناء الفتح + حفظ التركيز السابق لاستعادته عند الإغلاق */
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  /* نقل التركيز إلى الحوار عند الفتح */
  useEffect(() => {
    if (!open) return;
    containerRef.current?.focus();
  }, [open]);

  /* معالجة Escape و Tab trap */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !containerRef.current) return;
    const focusables = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && (active === first || active === containerRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      dir="rtl"
      role="presentation"
    >
      {/* الخلفية المعتمة */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={{ backgroundColor: 'var(--overlay)' }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-hidden="true"
      />
      {/* اللوحة */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? descId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative flex flex-col w-full animate-slide-up rounded-2xl border',
          'shadow-modal outline-none',
          sizeClasses[size],
          compact ? 'p-3' : 'p-5',
        )}
        style={{
          backgroundColor: 'var(--surface-modal)',
          borderColor: 'var(--surface-border)',
          maxHeight: 'min(90vh, var(--dialog-max-height))',
        }}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق الحوار"
            className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center rounded-lg text-text-muted transition-colors hover:text-text-primary hover:bg-surface-muted"
          >
            <X size={16} />
          </button>
        )}

        {title && (
          <div className="border-b pb-3 mb-4" style={{ borderColor: 'var(--surface-border)' }}>
            <h2 id={titleId} className="text-h3 font-semibold text-text-primary">
              {title}
            </h2>
            {subtitle && (
              <p id={descId} className="text-xs text-text-muted mt-1">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div
            className="flex items-center justify-start gap-2.5 pt-3 mt-4 border-t"
            style={{ borderColor: 'var(--surface-border)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default Dialog;
