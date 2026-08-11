'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Search, Mail, Phone, ToggleLeft, ToggleRight } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useRouteGuard } from '@/components/auth/route-guard';
import { ROLE_LABELS, UserRole } from '@/types';
import { cn, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  tenant?: { name: string };
  createdAt: string;
}

const ROLES: UserRole[] = ['super_admin', 'center_manager', 'supervisor', 'specialist', 'receptionist', 'accountant'];

export default function UsersPage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' });

  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);


  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '24' });
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const res = await apiClient.get<{ data: AppUser[]; meta: { total: number } }>(`/users?${params}`);
      setUsers(res.data.data);
      setTotal(res.data.meta?.total ?? 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const toggleStatus = async (id: string, current: boolean) => {
    try {
      await apiClient.patch(`/users/${id}/toggle-active`);
      toast.success(`تم ${current ? 'تعطيل' : 'تفعيل'} المستخدم`);
      fetchUsers();
    } catch {
      toast.error('فشل تحديث الحالة');
    }
  };

  const totalPages = Math.ceil(total / 24);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Users size={20} style={{ color: 'var(--primary)' }} />
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>المستخدمون</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{total} مستخدم</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard/users/new')}
          className="flex items-center gap-1.5 text-white text-sm px-4 py-2 rounded-lg transition bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
        >
          <Plus size={14} /> مستخدم جديد
        </button>
      </div>

      <div className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث عن مستخدم..."
              className="w-full text-sm rounded-lg pr-9 px-3 py-2"
              style={{ borderColor: 'var(--border)', outline: 'none' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)'; }} />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="text-sm rounded-lg px-3 py-2"
            style={{ borderColor: 'var(--border)', outline: 'none' }}
            onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
            onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)'; }}>
            <option value="">جميع الأدوار</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="لا يوجد مستخدمون" description="لم يتم إضافة أي مستخدم بعد" />
      ) : (
        <>
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <tr>
                    {['المستخدم', 'الدور', 'جهة الاتصال', 'الحالة', 'تاريخ الإنشاء', 'إجراءات'].map((h) => (
                      <th key={h} className="text-right text-xs font-medium py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {users.map((u) => (
                    <tr key={u.id} className="transition hover:bg-[var(--surface-secondary)]">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                            style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</p>
                            {u.tenant && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.tenant.name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>{ROLE_LABELS[u.role]}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <div className="flex items-center gap-1"><Mail size={11} /> {u.email}</div>
                          {u.phone && <div className="flex items-center gap-1"><Phone size={11} /> {u.phone}</div>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                          u.isActive ? 'bg-[var(--status-success-light)] text-[var(--status-success-text)]' : 'bg-[var(--surface-secondary)] text-[var(--text-muted)]')}>
                          {u.isActive ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDateTime(u.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => toggleStatus(u.id, u.isActive)}
                            className="text-xs border px-2 py-1 rounded-lg transition flex items-center gap-1 hover:bg-[var(--surface-secondary)]"
                            style={{ borderColor: 'var(--border)' }}>
                            {u.isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                            {u.isActive ? 'تعطيل' : 'تفعيل'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 transition hover:bg-[var(--surface-secondary)]"
                style={{ borderColor: 'var(--border)' }}>السابق</button>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 transition hover:bg-[var(--surface-secondary)]"
                style={{ borderColor: 'var(--border)' }}>التالي</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
