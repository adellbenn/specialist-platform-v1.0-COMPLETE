'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Key, Search, RefreshCw, LayoutGrid, List,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import { PageLoader } from '@/components/ui/spinner';
import { useRouteGuard } from '@/components/auth/route-guard';
import { PermissionMatrix } from '@/components/admin/permission-matrix';

export default function AdminPermissionsPage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' });
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getPermissions();
      setPermissions(res.data.data);
    } catch {
      toast.error('فشل تحميل الصلاحيات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const grouped = permissions.reduce((acc: Record<string, any[]>, p: any) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, any[]>);

  const filteredModules = Object.entries(grouped).filter(([module]) =>
    !search || module.includes(search.toLowerCase()),
  );

  const filteredGrouped = Object.fromEntries(filteredModules);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key size={20} style={{ color: 'var(--primary)' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>مصفوفة الصلاحيات</h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
            {permissions.length} صلاحية
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition ${viewMode === 'matrix' ? 'shadow-sm' : 'hover:bg-[var(--surface)]'}`}
            style={{ backgroundColor: viewMode === 'matrix' ? 'var(--primary)' : 'transparent', color: viewMode === 'matrix' ? '#fff' : 'var(--text-secondary)' }}>
            <LayoutGrid size={13} /> مصفوفة
          </button>
          <button onClick={() => setViewMode('list')}
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition ${viewMode === 'list' ? 'shadow-sm' : 'hover:bg-[var(--surface)]'}`}
            style={{ backgroundColor: viewMode === 'list' ? 'var(--primary)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)' }}>
            <List size={13} /> قائمة
          </button>
          <button onClick={fetchPermissions}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition hover:bg-[var(--surface)]"
            style={{ color: 'var(--text-secondary)' }}>
            <RefreshCw size={13} /> تحديث
          </button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input type="text" placeholder="بحث في الوحدات..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm rounded-xl pr-9 px-3 py-2 focus:outline-none focus:ring-2"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }} />
      </div>

      <PermissionMatrix
        grouped={filteredGrouped}
        selectedIds={new Set()}
        onToggle={() => {}}
        onToggleModule={() => {}}
        viewMode={viewMode}
      />
    </div>
  );
}
