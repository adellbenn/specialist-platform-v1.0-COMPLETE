'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Check, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableSkeleton } from './skeleton';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  selectable?: boolean;
  onSelectionChange?: (selectedKeys: string[]) => void;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyMessage = 'لا توجد بيانات',
  pageSize = 10,
  selectable = false,
  onSelectionChange,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [filterText, setFilterText] = useState('');
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const toggleSort = useCallback((key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') { setSortDir('desc'); }
      else if (sortDir === 'desc') { setSortKey(null); setSortDir(null); }
      else { setSortDir('asc'); }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey, sortDir]);

  const filteredData = useMemo(() => {
    if (!filterText.trim()) return data;
    const lower = filterText.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(lower);
      }),
    );
  }, [data, filterText, columns]);

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), 'ar');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedData = useMemo(
    () => sortedData.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sortedData, safePage, pageSize],
  );

  const allPageKeys = useMemo(() => pagedData.map(keyExtractor), [pagedData, keyExtractor]);
  const allSelected = allPageKeys.length > 0 && allPageKeys.every((k) => selectedKeys.has(k));
  const someSelected = allPageKeys.some((k) => selectedKeys.has(k));

  const toggleSelectAll = useCallback(() => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        allPageKeys.forEach((k) => next.delete(k));
      } else {
        allPageKeys.forEach((k) => next.add(k));
      }
      onSelectionChange?.(Array.from(next));
      return next;
    });
  }, [allSelected, allPageKeys, onSelectionChange]);

  const toggleRow = useCallback(
    (key: string) => {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key); else next.add(key);
        onSelectionChange?.(Array.from(next));
        return next;
      });
    },
    [onSelectionChange],
  );

  if (loading) {
    return <TableSkeleton rows={5} cols={columns.length + (selectable ? 1 : 0)} />;
  }

  const hasFilterable = columns.some((c) => c.filterable);

  return (
    <div className={cn('space-y-4', className)}>
      {hasFilterable && (
        <div className="relative max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="بحث..."
            value={filterText}
            onChange={(e) => { setFilterText(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 text-sm border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border)',
            }}
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-[24px]" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm" style={{ color: 'var(--text-primary)' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-secondary)' }}>
              {selectable && (
                <th className="px-4 py-3 w-12">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className={cn(
                      'w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all',
                      allSelected
                        ? 'border-primary bg-primary'
                        : someSelected
                          ? 'border-primary bg-primary/30'
                          : 'border-primary/30',
                    )}
                    aria-label="تحديد الكل"
                  >
                    {(allSelected || someSelected) && <Check size={12} className="text-white" />}
                  </button>
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-right font-semibold whitespace-nowrap"
                  style={{ width: col.width }}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:opacity-80 transition"
                    >
                      {col.header}
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : (
                        <ChevronsUpDown size={14} className="opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-16 text-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pagedData.map((row, i) => {
                const rowKey = keyExtractor(row);
                const isSelected = selectedKeys.has(rowKey);
                return (
                  <tr
                    key={rowKey}
                    className={cn(
                      'transition-colors',
                      isSelected && 'bg-primary/5',
                    )}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: isSelected ? undefined : 'var(--surface)',
                    }}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleRow(rowKey)}
                          className={cn(
                            'w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all',
                            isSelected
                              ? 'border-primary bg-primary'
                              : 'border-primary/30',
                          )}
                          aria-label="تحديد الصف"
                          aria-checked={isSelected}
                          role="checkbox"
                        >
                          {isSelected && <Check size={12} className="text-white" />}
                        </button>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                        {col.render ? col.render(row, i) : String(row[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span>
            {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sortedData.length)} من{' '}
            {sortedData.length}
          </span>
          <div className="flex items-center gap-1">
            <PaginationBtn
              disabled={safePage === 1}
              onClick={() => setPage(1)}
              label="الأولى"
            >
              <ChevronsRight size={14} />
            </PaginationBtn>
            <PaginationBtn
              disabled={safePage === 1}
              onClick={() => setPage((p) => p - 1)}
              label="السابقة"
            >
              <ChevronRight size={14} />
            </PaginationBtn>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
              .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis');
                acc.push(p);
                return acc;
              }, [])
              .map((item, i) =>
                item === 'ellipsis' ? (
                  <span key={`e-${i}`} className="px-1">...</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={cn(
                      'w-8 h-8 rounded-xl text-xs font-medium transition-all',
                      item === safePage
                        ? 'text-white'
                        : 'hover:opacity-80',
                    )}
                    style={
                      item === safePage
                        ? { backgroundColor: 'var(--primary)' }
                        : { color: 'var(--text-secondary)' }
                    }
                  >
                    {item}
                  </button>
                ),
              )}
            <PaginationBtn
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => p + 1)}
              label="التالية"
            >
              <ChevronLeft size={14} />
            </PaginationBtn>
            <PaginationBtn
              disabled={safePage === totalPages}
              onClick={() => setPage(totalPages)}
              label="الأخيرة"
            >
              <ChevronsLeft size={14} />
            </PaginationBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function PaginationBtn({
  disabled,
  onClick,
  label,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
      style={{ color: 'var(--text-secondary)' }}
    >
      {children}
    </button>
  );
}
