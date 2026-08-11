'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, Plus, Search, Mail, Phone } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useRouteGuard } from '@/components/auth/route-guard';
import { ROLE_LABELS, UserRole } from '@/types';
import { cn } from '@/lib/utils';

interface Specialist {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  specialization?: string;
  tenant?: { name: string };
  createdAt: string;
}

const SPECIALIZATIONS = [
  'تخاطب', 'علاج وظيفي', 'علاج طبيعي', 'نفسي', 'تربية خاصة',
  'صعوبات تعلم', 'توحد', 'فرط حركة',
];

export default function SpecialistsPage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager', 'supervisor'], redirectTo: '/dashboard' });

  const router = useRouter();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);


  const fetchSpecialists = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '24' });
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const res = await apiClient.get<{ data: Specialist[]; meta: { total: number } }>(`/users?${params}`);
      setSpecialists(res.data.data);
      setTotal(res.data.meta?.total ?? 0);
    } catch {
      setSpecialists([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchSpecialists(); }, [fetchSpecialists]);
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const totalPages = Math.ceil(total / 24);

  const ROLES: Array<{ value: string; label: string }> = [
    { value: '', label: 'جميع الأدوار' },
    ...Object.entries(ROLE_LABELS)
      .filter(([v]) => ['super_admin', 'center_manager', 'specialist', 'supervisor', 'receptionist', 'accountant'].includes(v))
      .map(([v, l]) => ({ value: v, label: l })),
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <UserCheck size={20} style={{ color: 'var(--primary)' }} />
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>الأخصائيون</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{total} أخصائي</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard/users')}
          className="flex items-center gap-1.5 text-white text-sm px-4 py-2 rounded-lg transition bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
        >
          <Plus size={14} /> إضافة مستخدم
        </button>
      </div>

      <div className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث عن أخصائي..."
              className="w-full text-sm rounded-lg pr-9 px-3 py-2"
              style={{ borderColor: 'var(--border)', outline: 'none' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)'; }}
            />
          </div>
          <select
            value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="text-sm rounded-lg px-3 py-2"
            style={{ borderColor: 'var(--border)', outline: 'none' }}
            onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
            onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)'; }}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : specialists.length === 0 ? (
        <EmptyState icon={UserCheck} title="لا يوجد أخصائيون" description="لم يتم إضافة أي أخصائي بعد" />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {specialists.map((s) => (
              <div key={s.id} className="rounded-2xl border p-4 transition cursor-pointer hover:shadow-[var(--shadow-card-hover)]"
                style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                onClick={() => router.push(`/dashboard/users?id=${s.id}`)}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                    style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                    {s.firstName?.[0]}{s.lastName?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{s.firstName} {s.lastName}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{ROLE_LABELS[s.role]}</p>
                  </div>
                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0', s.isActive ? 'bg-[var(--status-success)]' : 'bg-[var(--surface-secondary)]')} />
                </div>
                {s.specialization && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>{s.specialization}</span>
                )}
                <div className="mt-3 space-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <div className="flex items-center gap-1.5">
                    <Mail size={12} /> {s.email}
                  </div>
                  {s.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} /> {s.phone}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 transition hover:bg-[var(--surface-secondary)]"
                style={{ borderColor: 'var(--border)' }}>
                السابق
              </button>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 transition hover:bg-[var(--surface-secondary)]"
                style={{ borderColor: 'var(--border)' }}>
                التالي
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
