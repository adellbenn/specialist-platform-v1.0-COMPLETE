'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, User, Calendar, FileText, CreditCard, Loader2 } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface SearchResult {
  type:     'beneficiary' | 'appointment' | 'report' | 'invoice' | 'user';
  id:       string;
  title:    string;
  subtitle: string;
  meta?:    string;
  link:     string;
}

const TYPE_CONFIG = {
  beneficiary: { label: 'المستفيدون',  icon: User,       color: 'bg-[var(--status-info-light)] text-[var(--status-info-text)]' },
  appointment: { label: 'المواعيد',    icon: Calendar,   color: 'bg-[var(--status-scheduled-light)] text-[var(--status-scheduled-text)]' },
  report:      { label: 'التقارير',    icon: FileText,   color: 'bg-[var(--status-warning-light)] text-[var(--status-warning-text)]' },
  invoice:     { label: 'الفواتير',    icon: CreditCard, color: 'bg-[var(--status-success-light)] text-[var(--status-success-text)]' },
  user:        { label: 'المستخدمون',  icon: User,       color: 'bg-[var(--status-completed-light)] text-[var(--status-completed-text)]' },
};

type FilterType = 'all' | 'beneficiary' | 'appointment' | 'report' | 'invoice' | 'user';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const initialQ     = searchParams.get('q') ?? '';

  const [query, setQuery]     = useState(initialQ);
  const [input, setInput]     = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter]   = useState<FilterType>('all');

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: { results: SearchResult[]; total: number } }>(
        `/search?q=${encodeURIComponent(q)}&limit=50`,
      );
      setResults(res.data.data.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (initialQ) doSearch(initialQ); }, [initialQ, doSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length < 2) return;
    setQuery(input);
    router.push(`/dashboard/search?q=${encodeURIComponent(input)}`);
    doSearch(input);
  };

  // تجميع حسب النوع
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  const filtered = filter === 'all'
    ? results
    : results.filter((r) => r.type === filter);

  const typeCounts = Object.entries(grouped).map(([type, items]) => ({
    type: type as keyof typeof TYPE_CONFIG,
    count: items.length,
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Search Header */}
      <div>
        <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>البحث الشامل</h1>
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ابحث في المستفيدين، المواعيد، التقارير، الفواتير..."
              className="w-full pr-12 pl-4 py-3 text-sm border rounded-xl
                focus:outline-none focus:ring-2 focus:ring-primary/20 bg-[var(--background)] shadow-card"
              style={{ borderColor: 'var(--border)' }}
              autoFocus
            />
            <button type="submit"
              disabled={input.trim().length < 2}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-xs
                px-3 py-1.5 rounded-lg disabled:opacity-40 transition"
              style={{ backgroundColor: 'var(--primary)' }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = 'var(--primary-hover)'; }}
              onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = 'var(--primary)'; }}>
              بحث
            </button>
          </div>
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
          <Loader2 size={18} className="animate-spin" style={{ color: 'var(--primary)' }} />
          <span className="text-sm">جارٍ البحث عن "{query}"...</span>
        </div>
      )}

      {/* Results */}
      {!loading && query && results.length > 0 && (
        <>
          {/* Summary */}
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{results.length}</span>
            نتيجة للبحث عن
            <span className="font-semibold" style={{ color: 'var(--primary)' }}>"{query}"</span>
          </div>

          {/* Type Filters */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition',
                filter === 'all' ? 'text-white' : 'hover:bg-[var(--surface)]',
              )}
              style={{
                backgroundColor: filter === 'all' ? 'var(--primary)' : 'var(--surface)',
                color: filter === 'all' ? 'white' : 'var(--text-secondary)',
              }}
            >
              الكل ({results.length})
            </button>
            {typeCounts.map(({ type, count }) => {
              const config = TYPE_CONFIG[type];
              const Icon   = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition',
                    filter === type ? 'text-white' : 'hover:bg-[var(--surface)]',
                  )}
                  style={{
                    backgroundColor: filter === type ? 'var(--primary)' : 'var(--surface)',
                    color: filter === type ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  <Icon size={13} />
                  {config.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Results List */}
          <div className="space-y-2">
            {filtered.map((result) => {
              const config = TYPE_CONFIG[result.type];
              const Icon   = config.icon;
              return (
                <Link key={`${result.type}-${result.id}`} href={result.link}>
                  <div className="flex items-center gap-4 bg-[var(--background)] border rounded-xl p-4
                    hover:shadow-card-hover transition cursor-pointer" style={{ borderColor: 'var(--border)' }}>
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', config.color)}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{result.title}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{result.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {result.meta && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface)' }}>
                          {result.meta}
                        </span>
                      )}
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{config.label}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* No Results */}
      {!loading && query && results.length === 0 && (
        <div className="text-center py-16">
          <Search size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>لا توجد نتائج</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            لم يتم العثور على نتائج لـ "{query}" — جرّب كلمات مختلفة
          </p>
        </div>
      )}

      {/* Initial State */}
      {!query && !loading && (
        <div className="text-center py-16">
          <Search size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>ابحث في جميع بيانات المركز</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            المستفيدون، المواعيد، التقارير، الفواتير، المستخدمون
          </p>
        </div>
      )}
    </div>
  );
}
