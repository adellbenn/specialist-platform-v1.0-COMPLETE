import { cn } from '@/lib/utils';

interface BadgeProps {
  label: string;
  className?: string;
  style?: React.CSSProperties;
  dot?: boolean;
}

export function Badge({ label, className, style, dot }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium', className)}
      style={style}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
      {label}
    </span>
  );
}
