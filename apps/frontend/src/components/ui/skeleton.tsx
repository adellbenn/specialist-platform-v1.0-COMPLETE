import { cn } from '@/lib/utils';

/**
 * Skeleton — عنصر نائب بأبعاد المحتوى النهائي.
 *
 * الغرض ليس زخرفة: الـskeleton يحفظ أبعاد الصفحة النهائية، فيقفز المحتوى إلى
 * مواضعه بدل أن يزيح التخطيط (CLS) ويبدو التطبيق معطّلًا. لذلك كل composite هنا
 * يق��د أبعاد ما يستبدله فعلًا، لا أبعادًا تقريبية.
 *
 * كل الألوان عبر متغيّرات CSS القائمة (`--border`, `--surface`, `--text-muted`)
 * فيعمل RTL والوضع الداكن دون أي branching.
 */

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  /** للاختبارات والقراءة: يميّز العظام عن المحتوى الحقيقي */
  'data-testid'?: string;
}

export function Skeleton({ className, style, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      {...rest}
      className={cn('animate-pulse rounded-lg', className)}
      style={{ backgroundColor: 'var(--border)', ...style }}
    />
  );
}

/** عنوان الصفحة + سطر وصف + أيقونة مربعة، مطابقة لبنية headers الصفحات. */
export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)} data-testid="page-header-skeleton">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
    </div>
  );
}

/** شريط أدوات: بحث + مرشّحات + إجراء — مطابق لصفوف البحث/الفلترة. */
export function ToolbarSkeleton({ className, chips = 5 }: { className?: string; chips?: number }) {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)} data-testid="toolbar-skeleton">
      <Skeleton className="h-9 w-56 rounded-lg" />
      {Array.from({ length: chips }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-20 rounded-lg" />
      ))}
    </div>
  );
}

/** صف بطاقات إحصائية — نفس أبعاد `.grid-cols-2 sm:grid-cols-4` المستخدمة فعليًا. */
export function StatsRowSkeleton({ className, count = 4 }: { className?: string; count?: number }) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-3', className)} data-testid="stats-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl p-3.5 flex items-center gap-3" style={{ backgroundColor: 'var(--surface)' }}>
          <Skeleton className="w-5 h-5 rounded-md flex-shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** شبكة بطاقات — بديل PageLoader في صفحات البطاقات. */
export function ListSkeleton({ className, count = 6 }: { className?: string; count?: number }) {
  return (
    <div
      className={cn('grid sm:grid-cols-2 lg:grid-cols-3 gap-3', className)}
      data-testid="list-skeleton"
      role="status"
      aria-label="جارٍ التحميل"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border p-4 space-y-3"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** جدول: ترويسة + صفوف، مطابق لبنية الجداول في صفحات القائمة. */
export function TableSkeleton({ className, rows = 8, columns = 5 }: { className?: string; rows?: number; columns?: number }) {
  return (
    <div
      className={cn('rounded-xl border overflow-hidden', className)}
      style={{ borderColor: 'var(--border)' }}
      data-testid="table-skeleton"
      role="status"
      aria-label="جارٍ التحميل"
    >
      <div
        className="flex items-center gap-4 px-4 py-3"
        style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 px-4 py-3.5"
          style={{ borderBottom: r === rows - 1 ? undefined : '1px solid var(--border)' }}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={c}
              className="h-3.5 flex-1"
              style={{ maxWidth: c === 0 ? '22%' : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** شبكة تقويم: شريط أيام + شبكة خلايا، مطابقة لبنية `components/calendar`. */
export function CalendarSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('rounded-xl border overflow-hidden', className)}
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
      data-testid="calendar-skeleton"
      role="status"
      aria-label="جارٍ التحميل"
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <Skeleton className="h-4 w-28" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="px-2 py-2 text-center" style={{ borderColor: 'var(--border)' }}>
            <Skeleton className="h-3 w-8 mx-auto" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="h-20 p-1.5"
            style={{ borderColor: 'var(--border)', borderInlineStartWidth: 1, borderTopWidth: 1 }}
          >
            <Skeleton className="h-3 w-5" />
            <div className="mt-1.5 space-y-1">
              <Skeleton className="h-5 w-full rounded" />
              <Skeleton className="h-5 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** بطاقة تعريفية: مفتاح/قيمة — لصفحات التفاصيل بعد `if (loading) return`. */
export function DetailSkeleton({ className, rows = 6 }: { className?: string; rows?: number }) {
  return (
    <div
      className={cn('rounded-xl border p-5 space-y-4', className)}
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
      data-testid="detail-skeleton"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-3 w-24 flex-shrink-0" />
          <Skeleton className="h-3.5 flex-1" style={{ maxWidth: `${45 + ((i * 13) % 35)}%` }} />
        </div>
      ))}
    </div>
  );
}

/** حقول نموذج: تسمية فوق حقل — لصفحات الإنشاء/التحرير. */
export function FormSkeleton({ className, fields = 6 }: { className?: string; fields?: number }) {
  return (
    <div className={cn('space-y-4', className)} data-testid="form-skeleton">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/**
 * PageSkeleton — حالة تحميل **التفويض** على مستوى الـshell.
 *
 * تُستخدم في `dashboard/layout.tsx` بينما `status` في idle/loading. تحافظ على
 * شكل الصفحة (ترويسة + أدوات + محتوى) بدل إظهار spinner وسط فراغ، فلا يبدو
 * التطبيق معطّلًا أثناء انتظار صلاحيات.
 *
 * `variant` يختار شكل المحتوى ليطابق الصفحة الهدف بدل شكل موحّد لا يشبه شيئًا.
 */
export function PageSkeleton({
  variant = 'table',
  className,
}: {
  variant?: 'table' | 'list' | 'calendar' | 'detail' | 'form';
  className?: string;
}) {
  return (
    <div className={cn('space-y-5', className)} data-testid="page-skeleton" role="status" aria-label="جارٍ التحميل">
      <PageHeaderSkeleton />
      {variant === 'detail' ? (
        <>
          <StatsRowSkeleton count={3} />
          <DetailSkeleton />
        </>
      ) : variant === 'form' ? (
        <>
          <FormSkeleton />
          <div className="flex justify-end gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </>
      ) : (
        <>
          <StatsRowSkeleton />
          <ToolbarSkeleton />
          {variant === 'calendar' ? <CalendarSkeleton /> : variant === 'list' ? <ListSkeleton /> : <TableSkeleton />}
        </>
      )}
    </div>
  );
}