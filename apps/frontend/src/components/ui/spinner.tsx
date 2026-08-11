import { cn } from '@/lib/utils';

interface SpinnerProps { className?: string; size?: 'sm' | 'md' | 'lg'; }

const sizes = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-8 h-8' };

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <svg
        className={cn('animate-spin', sizes[size])}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          cx="12" cy="12" r="10"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="2.5"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-64">
      <Spinner size="lg" />
    </div>
  );
}
