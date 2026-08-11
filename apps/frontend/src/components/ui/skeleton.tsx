import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-2xl', className)}
      style={{ backgroundColor: 'var(--border)' }}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div
      className="rounded-[24px] p-6 space-y-4"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <Skeleton className="h-5 w-1/3 rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 rounded-xl w-full" />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div
      className="rounded-[24px] overflow-hidden"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div
        className="flex gap-4 px-6 py-4"
        style={{ backgroundColor: 'var(--surface-secondary)' }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 rounded-xl" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-4 px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1 rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div
      className="rounded-[24px] p-6 space-y-5"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <Skeleton className="h-5 w-1/4 rounded-xl" />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-1/3 rounded-xl" />
          <Skeleton className="h-11 w-full rounded-2xl" />
        </div>
      ))}
      <Skeleton className="h-11 w-32 rounded-2xl" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[24px] p-5"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Skeleton className="h-4 w-1/2 rounded-xl mb-3" />
            <Skeleton className="h-8 w-1/3 rounded-xl mb-2" />
            <Skeleton className="h-3 w-2/3 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CardSkeleton lines={5} />
        </div>
        <div>
          <CardSkeleton lines={4} />
        </div>
      </div>
    </div>
  );
}
