'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Key, Check, X as XIcon, Search, SlidersHorizontal, CheckSquare, XSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import { PageLoader } from '@/components/ui/spinner';
import { useRouteGuard } from '@/components/auth/route-guard';
import { cn } from '@/lib/utils';

export default function RoleDetailPage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' });
  const { id } = useParams();
  const router = useRouter();
  const [role, setRole] = useState<any>(null);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [roleRes, permRes] = await Promise.all([
        adminService.getRole(id as string),
        adminService.getPermissions(),
      ]);
      const r = roleRes.data.data;
      const perms = permRes.data.data;
      setRole(r);
      setPermissions(perms);
      setSelectedIds(new Set(r.permissions?.map((p: any) => p.id) || []));
    } catch {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const togglePermission = (permId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const isModuleComplete = (module: string) => {
    const modulePerms = permissions.filter((p) => p.module === module);
    return modulePerms.length > 0 && modulePerms.every((p) => selectedIds.has(p.id));
  };

  const toggleModule = (module: string) => {
    const modulePerms = permissions.filter((p) => p.module === module);
    const allSelected = modulePerms.every((p) => selectedIds.has(p.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const p of modulePerms) {
        if (allSelected) next.delete(p.id);
        else next.add(p.id);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(permissions.map((p) => p.id)));
  const clearAll = () => setSelectedIds(new Set());

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.bulkAssignPermissions(id as string, Array.from(selectedIds));
      toast.success('تم تحديث الصلاحيات');
    } catch {
      toast.error('فشل التحديث');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!role) return <p className="text-center py-10" style={{ color: 'var(--text-muted)' }}>الدور غير موجود</p>;

  const grouped = permissions.reduce((acc: Record<string, any[]>, p: any) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, any[]>);

  const filteredModules: [string, any[]][] = Object.entries(grouped).filter(([module]) =>
    !search || module.includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => router.push('/dashboard/admin/roles')}
          className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors">
          <ArrowRight size={18} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: role.color }}>
          {role.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{role.name}</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{role.description || 'لا يوجد وصف'}</p>
        </div>
        <div className="mr-auto flex items-center gap-2 text-sm">
          <Key size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>{selectedIds.size} / {permissions.length} صلاحية</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm rounded-xl pr-9 px-3 py-2 focus:outline-none focus:ring-2"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }} />
        </div>
        <button onClick={selectAll}
          className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl transition"
          style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}>
          <CheckSquare size={14} style={{ color: 'var(--success)' }} /> تحديد الكل
        </button>
        <button onClick={clearAll}
          className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl transition"
          style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}>
          <XSquare size={14} style={{ color: 'var(--danger)' }} /> إلغاء الكل
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 text-white text-sm px-5 py-2 rounded-xl font-medium transition-all disabled:opacity-50"
          style={{ backgroundColor: 'var(--primary)' }}>
          {saving ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
        </button>
      </div>

      {/* Permission Matrix */}
      <div className="space-y-3">
        {filteredModules.map(([module, perms]: [string, any[]]) => (
          <div key={module} className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border)' }}>
            {/* Module Header */}
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer transition hover:opacity-80"
              style={{ backgroundColor: 'var(--surface)' }}
              onClick={() => toggleModule(module)}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {module === 'dashboard' ? 'لوحة التحكم' :
                   module === 'beneficiaries' ? 'المستفيدون' :
                   module === 'appointments' ? 'المواعيد' :
                   module === 'sessions' ? 'الجلسات' :
                   module === 'specialists' ? 'الأخصائيون' :
                   module === 'medical_records' ? 'السجلات الطبية' :
                   module === 'files' ? 'الملفات' :
                   module === 'reports' ? 'التقارير' :
                   module === 'payments' ? 'المدفوعات' :
                   module === 'invoices' ? 'الفواتير' :
                   module === 'users' ? 'المستخدمون' :
                   module === 'roles' ? 'الأدوار' :
                   module === 'permissions' ? 'الصلاحيات' :
                   module === 'settings' ? 'الإعدادات' :
                   module === 'notifications' ? 'الإشعارات' :
                   module === 'analytics' ? 'الإحصائيات' :
                   module === 'audit' ? 'التدقيق' :
                   module === 'tenant' ? 'المنشأة' :
                   module === 'profile' ? 'الملف الشخصي' : module}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: isModuleComplete(module) ? 'var(--success-light)' : 'var(--surface-secondary)', color: isModuleComplete(module) ? 'var(--success-text)' : 'var(--text-muted)' }}>
                  {perms.filter((p) => selectedIds.has(p.id)).length}/{perms.length}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                {isModuleComplete(module) ? 'الكل محدد' : 'تحديد الكل'}
              </div>
            </div>

            {/* Permission Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 p-3">
              {perms.map((perm: any) => {
                const selected = selectedIds.has(perm.id);
                return (
                  <button key={perm.id} onClick={() => togglePermission(perm.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-right',
                      selected
                        ? 'text-white shadow-sm'
                        : 'hover:bg-[var(--surface)]',
                    )}
                    style={{
                      backgroundColor: selected ? 'var(--primary)' : 'transparent',
                      color: selected ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {selected ? <Check size={12} /> : <XIcon size={12} />}
                    {perm.displayName || perm.action}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredModules.length === 0 && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>لا توجد صلاحيات تطابق البحث</p>
      )}
    </div>
  );
}
