import { cn } from '@/lib/utils';

export interface ProgressRingProps {
  /** النسبة من 0 إلى 100 */
  value: number;
  /** قطر الحلقة بالبكسل */
  size?: number;
  /** سماكة الخط بالبكسل */
  strokeWidth?: number;
  /** محتوى مركزي مخصّص (يستبدل النسبة الافتراضية) */
  label?: React.ReactNode;
  /** إظهار النسبة المئوية في المنتصف */
  showValue?: boolean;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
  'aria-label'?: string;
}

/**
 * حلقة تقدّم دائرية (SVG) — بدون مكتبات خارجية، تعتمد على متغيّرات
 * السمات فتدعم الوضع الداكن وتخصيص اللون الأساسي. التمركز منطقي (RTL-safe).
 */
export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 6,
  label,
  showValue = false,
  className,
  trackClassName,
  indicatorClassName,
  'aria-label': ariaLabel,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="var(--surface-border-strong)"
          className={trackClassName}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke="var(--primary)"
          className={cn('transition-[stroke-dashoffset] duration-500 ease-out', indicatorClassName)}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {label ?? (
          showValue ? (
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {Math.round(clamped)}%
            </span>
          ) : null
        )}
      </div>
    </div>
  );
}

export default ProgressRing;
