'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export type Align = 'start' | 'center' | 'end';

export interface Column<T> {
  /** مفتاح البيانات داخل الصف (للـ sorting و accessor) */
  key: string;
  /** عنوان العمود */
  header: string;
  /** دالة استخراج/تنسيق القيمة */
  render: (row: T) => ReactNode;
  /** إظهار عمود الفرز (يزرّ الفرز بجانب العنوان) */
  sortable?: boolean;
  /** محاذاة المحتوى */
  align?: Align;
  /** إخفاء اختياري عبر شكل الشاشة (يُمرَّر كـ className إضافي للخلية) */
  className?: string;
  /** عرض ثابت للعمود */
  width?: string;
}

interface BaseRow {
  id: string;
}

interface DataTableProps<T extends BaseRow> {
  columns: Column<T>[];
  /** بيانات الصفوف */
  data: T[];
  /** مفتاح الحالة/الوضع (لإعادة بناء الحالة الداخلية عند تغيّر المصدر) */
  dataKey?: string;
  /** عناصر إضافية أعلى الجدول (أزرار تصدير/إضافة... إلخ) */
  toolbar?: ReactNode;
  /** محتوى فارغ يُعرض عند غياب البيانات */
  emptyTitle?: string;
  /** وصف الحالة الفارغة */
  emptyDescription?: string;
  /** تخصيص المحتوى الفارغ بالكامل */
  renderEmpty?: () => ReactNode;
  /** عدد الصفوف المعروضة لكل صفحة */
  pageSize?: number;
  /** إظهار أرقام الصفحات وعدّادها */
  showPagination?: boolean;
  /** إظهار شريط البحث الداخلي */
  showSearch?: boolean;
  /** عنوان بحث عام بدل النمط الافتراضي */
  searchPlaceholder?: string;
  /** إظهار عدّاد النتائج (إجمالي) */
  showCount?: boolean;
  /** سطر إجمالي/إجراءات أسفل الجدول */
  footer?: ReactNode;
  /** حالة التحميل (صفوف هيكلية + تعطيل البحث) */
  loading?: boolean;
  /** زرّ/إجراءات لكل صف */
  rowActions?: (row: T) => ReactNode;
  /** تلوين صفوف بديل (زربرا) */
  zebra?: boolean;
  /** حشو اختياري للخلية */
  cellClassName?: string;
  className?: string;
}

/**
 * جدول بيانات عام بالعربية (RTL):
 * فرز العمود، بحث نصي، ترقيم صفحات، صفوف هيكلية أثناء التحميل،
 * حالة فارغة، عدّاد النتائج، وإجراءات لكل صف.
 */
export function DataTable<T extends BaseRow>({
  columns,
  data,
  dataKey,
  toolbar,
  emptyTitle = 'لا توجد بيانات',
  emptyDescription,
  renderEmpty,
  pageSize = 10,
  showPagination = true,
  showSearch = false,
  searchPlaceholder = 'بحث...',
  showCount = false,
  footer,
  loading = false,
  rowActions,
  zebra = true,
  cellClassName,
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [dataVersion, setDataVersion] = useState(0);

  /* إعادة تعيين الحالة الداخلية عند تغيّر مصدر البيانات (لأي مفتاح بيانات خارجي) */
  const key = dataKey ?? dataVersion;
  useMemo(() => setPage(1), [key]);
  useMemo(() => setSortKey(null), [key]);

  const filtered = useMemo(() => {
    const query = search.trim();
    if (!query) return data;
    return data.filter((row) =>
      columns.some((col) => {
        const value = col.render(row);
        if (value == null) return false;
        return String(value).includes(query);
      }),
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String(a[sortKey as keyof T] ?? '');
      const bv = String(b[sortKey as keyof T] ?? '');
      const cmp = av.localeCompare(bv, 'ar', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => sorted.slice((safePage - 1) * pageSize, safePage * pageSize), [sorted, safePage, pageSize]);

  const toggleSort = (key: string) => {
    setSortKey((prev) => {
      if (prev !== key) return key;
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return key;
    });
  };

  return (
    <div className={cn('space-y-3', className)}>
      {(toolbar || showSearch || showCount) && (
        <div className="flex flex-wrap items-center gap-2 group peer" style={{}}>
          {toolbar}
          <div className="ms-auto flex items-center gap-2.5">
            {showCount && (
              <span className="text-xs text-text-token-muted">{sorted.length} نتيجة</span>
            )}
            {showSearch && (
              <div className="relative">
                <Search size={14} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-text-token-muted" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder={searchPlaceholder}
                  className="input rounded-lg h-9 w-52 ps-8 pe-3 text-xs"
                  aria-label={searchPlaceholder}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-surface-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-0 text-right">
            <thead className="bg-surface-background-secondary">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-xs font-medium text-text-token-secondary whitespace-nowrap',
                      col.align === 'center' && 'text-center',
                      col.align === 'end' && 'text-left',
                      col.width && `min-w-[${col.width}]`,
                    )}
                    aria-sort={
                      sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {col.sortable && (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className="text-text-token-muted hover:text-text-token-primary transition-colors"
                          aria-label={`فرز حسب ${col.header}`}
                        >
                          {sortKey === col.key ? (
                            sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                          ) : (
                            <ChevronsUpDown size={13} />
                          )}
                        </button>
                      )}
                    </span>
                  </th>
                ))}
                {rowActions && (
                  <th className="px-4 py-3 text-xs font-medium text-text-token-secondary whitespace-nowrap">
                    إجراءات
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                  <tr key={`skel-${i}`} className="border-t border-surface-border">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3.5">
                        <div className="h-3.5 w-24 rounded-full bg-surface-muted animate-pulse" />
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-4 py-3.5">
                        <div className="h-6 w-12 rounded-md bg-surface-muted animate-pulse" />
                      </td>
                    )}
                  </tr>
                ))
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (rowActions ? 1 : 0)} className="px-4 py-8">
                    {renderEmpty ? (
                      renderEmpty()
                    ) : (
                      <EmptyState
                        icon={Inbox}
                        title={emptyTitle}
                        description={emptyDescription}
                      />
                    )}
                  </td>
                </tr>
              ) : (
                pageRows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-t border-surface-border transition-colors hover:bg-surface-background-secondary',
                      zebra && i % 2 === 1 && 'bg-surface-background-secondary/40',
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3 text-small text-text-token-primary',
                          col.align === 'center' && 'text-center',
                          col.align === 'end' && 'text-left',
                          cellClassName,
                          col.className,
                        )}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">{rowActions(row)}</div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {footer && (
          <div className="border-t border-surface-border px-4 py-3 bg-surface-background-secondary/50">{footer}</div>
        )}
      </div>

      {showPagination && !loading && totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-xs text-text-token-muted">
            صفحة {safePage} من {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              التالي
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** وسيلة مساعدة — علامة حالة (أخضر/برتقالي/أحمر...) من رموز الحالة */
export function StatusBadge<T extends BaseRow>(
  value: string | null | undefined,
  map: Record<string, { label: string; className: string }>,
): ReactNode {
  if (!value) return null;
  const config = map[value];
  if (!config) return <Badge label={value} className="bg-surface-muted text-text-token-muted" />;
  return <Badge label={config.label} className={config.className} dot />;
}
