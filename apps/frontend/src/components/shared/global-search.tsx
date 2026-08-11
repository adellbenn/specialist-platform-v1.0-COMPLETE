'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, User, Calendar, FileText, CreditCard, Loader2 } from 'lucide-react';
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
  beneficiary:  { label: 'مستفيد',   icon: User,       color: 'text-info' },
  appointment:  { label: 'موعد',     icon: Calendar,   color: 'text-warning' },
  report:       { label: 'تقرير',    icon: FileText,   color: 'text-primary' },
  invoice:      { label: 'فاتورة',   icon: CreditCard, color: 'text-success' },
  user:         { label: 'مستخدم',   icon: User,       color: 'text-text-secondary' },
};

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<SearchResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef  = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]); setOpen(false); return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<{ data: { results: SearchResult[] } }>(
          `/search?q=${encodeURIComponent(query)}&limit=6`,
        );
        setResults(res.data.data.results);
        setOpen(true);
        setActiveIdx(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(results.length > 0);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [results]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      navigate(results[activeIdx]);
    }
  };

  const navigate = useCallback((result: SearchResult) => {
    router.push(result.link);
    setOpen(false);
    setQuery('');
  }, [router]);

  const clear = () => { setQuery(''); setResults([]); setOpen(false); };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="بحث... (Ctrl+K)"
          className="w-full h-10 pr-10 pl-9 text-sm border rounded-[12px] transition-all duration-200 outline-none"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => {
            if (results.length > 0) setOpen(true);
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.backgroundColor = 'var(--background)';
          }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = 'var(--surface)'; }}
        />
        {/* Right clear/loading indicator */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {loading && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />}
          {query && !loading && (
            <button onClick={clear} className="flex items-center justify-center hover:opacity-70 transition">
              <X size={14} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute top-full mt-2 w-full rounded-[12px] border shadow-lg z-50 overflow-hidden"
          style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
        >
          <div className="py-1.5 max-h-80 overflow-y-auto">
            {results.map((result, idx) => {
              const config = TYPE_CONFIG[result.type];
              const Icon   = config.icon;
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => navigate(result)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-right transition',
                  )}
                  style={{
                    backgroundColor: idx === activeIdx ? 'var(--primary-light)' : 'transparent',
                    color: 'var(--text-primary)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = idx === activeIdx ? 'var(--primary-light)' : 'transparent'; }}
                >
                  <Icon size={16} className={cn('flex-shrink-0', config.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{result.title}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{result.subtitle}</p>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{config.label}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t px-4 py-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
            <button
              onClick={() => {
                router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
                setOpen(false);
              }}
              className="text-xs hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              عرض جميع النتائج للبحث عن &ldquo;{query}&rdquo;
            </button>
          </div>
        </div>
      )}

      {open && results.length === 0 && query.trim().length >= 2 && !loading && (
        <div
          className="absolute top-full mt-1.5 w-full rounded-xl border shadow-lg z-50 px-4 py-5 text-center"
          style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>لا توجد نتائج لـ &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
