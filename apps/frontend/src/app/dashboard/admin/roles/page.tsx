'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, Plus, Search, MoreVertical, Copy, Archive, Trash2, Eye,
  Users as UsersIcon, Key, CheckCircle, XCircle, SlidersHorizontal,
  X, FileText, Palette, Hash, Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { PermissionGate } from '@/components/auth/permission-gate';
import { useRouteGuard } from '@/components/auth/route-guard';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/utils';
import { Role } from '@/types';
import { useThemeCustomizer } from '@/store/theme-customizer.store';

const DEFAULT_ROLE_COLOR = useThemeCustomizer.getState().customAccentColor || '#2563EB';

interface RoleItem extends Role {}

export default function AdminRolesPage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' });
  const router = useRouter();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<any[] | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState(DEFAULT_ROLE_COLOR);
  const [formPriority, setFormPriority] = useState(0);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, statsRes] = await Promise.all([
        adminService.getRoles(),
        adminService.getRoleStats(),
      ]);
      setRoles(rolesRes.data.data);
      setStats(statsRes.data.data);
    } catch {
      toast.error('فشل تحميل الأدوار');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  useEffect(() => {
    if (!showDrawer) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDrawer(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showDrawer]);

  const filtered = roles.filter((r) => {
    if (filterActive === true && !r.isActive) return false;
    if (filterActive === false && r.isActive) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openCreate = () => {
    setEditingRole(null);
    setFormName('');
    setFormDesc('');
    setFormColor(DEFAULT_ROLE_COLOR);
    setFormPriority(0);
    setShowDrawer(true);
  };

  const openEdit = (role: RoleItem) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormDesc(role.description || '');
    setFormColor(role.color);
    setFormPriority(role.priority);
    setShowDrawer(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('اسم الدور مطلوب'); return; }
    try {
      if (editingRole) {
        await adminService.updateRole(editingRole.id, { name: formName, description: formDesc, color: formColor, priority: formPriority });
        toast.success('تم تحديث الدور');
      } else {
        await adminService.createRole({ name: formName, description: formDesc, color: formColor, priority: formPriority });
        toast.success('تم إنشاء الدور');
      }
      setShowDrawer(false);
      fetchRoles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل الحفظ');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await adminService.duplicateRole(id);
      toast.success('تم نسخ الدور');
      fetchRoles();
    } catch { toast.error('فشل النسخ'); }
  };

  const handleArchive = async (id: string) => {
    try {
      await adminService.archiveRole(id);
      toast.success('تم أرشفة الدور');
      fetchRoles();
    } catch { toast.error('فشل الأرشفة'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
    try {
      await adminService.deleteRole(id);
      toast.success('تم حذف الدور');
      fetchRoles();
    } catch { toast.error('فشل الحذف'); }
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const runCompare = async () => {
    if (compareIds.length < 2) { toast.error('اختر دورين على الأقل للمقارنة'); return; }
    try {
      const res = await adminService.compareRoles(compareIds);
      setCompareData(res.data.data);
    } catch { toast.error('فشل المقارنة'); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي الأدوار', value: stats.total, icon: Shield, color: 'var(--primary)' },
            { label: 'نشط', value: stats.active, icon: CheckCircle, color: 'var(--success)' },
            { label: 'مؤرشف', value: stats.archived, icon: Archive, color: 'var(--warning)' },
            { label: 'صلاحيات كل دور', value: stats.withPermissions, icon: Key, color: 'var(--info)' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <s.icon size={14} style={{ color: s.color }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="بحث في الأدوار..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm rounded-xl px-10 py-2.5 focus:outline-none focus:ring-2"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
          />
        </div>
        <select value={filterActive === null ? '' : filterActive ? 'active' : 'archived'} onChange={(e) => setFilterActive(e.target.value === '' ? null : e.target.value === 'active')}
          className="text-sm rounded-xl px-3 py-2.5 focus:outline-none"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
          <option value="">كل الأدوار</option>
          <option value="active">النشطة فقط</option>
          <option value="archived">المؤرشفة فقط</option>
        </select>
        {compareIds.length >= 2 && (
          <button onClick={runCompare}
            className="flex items-center gap-1.5 text-xs px-4 py-2.5 rounded-xl font-medium transition-all"
            style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
            <Eye size={14} /> مقارنة ({compareIds.length})
          </button>
        )}
        <PermissionGate permission="role:create">
          <button onClick={openCreate}
            className="flex items-center gap-1.5 text-white text-sm px-4 py-2.5 rounded-xl font-medium transition-all mr-auto"
            style={{ backgroundColor: 'var(--primary)' }}>
            <Plus size={14} /> دور جديد
          </button>
        </PermissionGate>
      </div>

      {/* Role Cards */}
      {filtered.length === 0 ? (
        <EmptyState icon={Shield} title="لا توجد أدوار" description="لم يتم إنشاء أي أدوار بعد" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((role) => (
            <div key={role.id}
              className="rounded-xl p-5 transition-all hover:shadow-lg group"
              style={{
                backgroundColor: 'var(--background)',
                border: role.isActive ? '1px solid var(--border)' : '1px dashed var(--border)',
                opacity: role.isActive ? 1 : 0.7,
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                    style={{ backgroundColor: role.color }}>
                    {role.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{role.name}</p>
                    {role.description && (
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{role.description}</p>
                    )}
                  </div>
                </div>
                {/* Checkbox for comparison */}
                <label className="relative flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={compareIds.includes(role.id)} onChange={() => toggleCompare(role.id)}
                    className="sr-only peer" />
                  <div className="w-4 h-4 rounded border-2 peer-checked:border-transparent peer-checked:bg-[var(--primary)] transition-all"
                    style={{ borderColor: compareIds.includes(role.id) ? 'var(--primary)' : 'var(--border)' }}>
                    {compareIds.includes(role.id) && <CheckCircle size={16} className="text-white" />}
                  </div>
                </label>
              </div>

              {/* Meta */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Key size={12} />
                  <span>{role.permissions?.length || 0} صلاحية</span>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Hash size={12} />
                  <span>الأولوية: {role.priority}</span>
                </div>
                {role.isSystem && (
                  <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary)' }}>
                    <Shield size={10} /> نظامي
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => router.push(`/dashboard/admin/roles/${role.id}`)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition"
                  style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}>
                  <Eye size={12} /> تفاصيل
                </button>
                <button onClick={() => openEdit(role)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition"
                  style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}>
                  <SlidersHorizontal size={12} /> تعديل
                </button>
                <button onClick={() => handleDuplicate(role.id)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition"
                  style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}>
                  <Copy size={12} /> نسخ
                </button>
                {!role.isSystem && (
                  <>
                    <button onClick={() => handleArchive(role.id)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition"
                      style={{ backgroundColor: 'var(--surface)', color: 'var(--warning)' }}>
                      <Archive size={12} />
                    </button>
                    <button onClick={() => handleDelete(role.id, role.name)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition"
                      style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparison Panel */}
      {compareData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{ backgroundColor: 'var(--overlay)' }} onClick={() => setCompareData(null)} />
          <div className="relative w-full max-w-4xl max-h-[80vh] overflow-auto rounded-2xl shadow-2xl p-6" style={{ backgroundColor: 'var(--background)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>مقارنة الأدوار</h3>
              <button onClick={() => setCompareData(null)} className="p-1.5 rounded-lg hover:bg-[var(--surface)]">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-right p-2 font-semibold" style={{ color: 'var(--text-muted)' }}>الصلاحية</th>
                    {compareData.map((r: any) => (
                      <th key={r.id} className="text-center p-2 font-semibold" style={{ color: r.color }}>{r.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compareData[0]?.missingPermissions?.map((perm: any) => (
                    <tr key={perm.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="p-2 text-xs" style={{ color: 'var(--text-primary)' }}>{perm.key}</td>
                      {compareData.map((r: any) => {
                        const has = r.permissions.some((p: any) => p.id === perm.id);
                        return (
                          <td key={r.id} className="text-center p-2">
                            {has
                              ? <CheckCircle size={16} className="inline" style={{ color: 'var(--success)' }} />
                              : <XCircle size={16} className="inline" style={{ color: 'var(--danger)' }} />
                            }
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0" style={{ backgroundColor: 'var(--overlay)' }} onClick={() => setShowDrawer(false)} />
          <div role="dialog" aria-modal="true" aria-label={editingRole ? 'تعديل دور' : 'دور جديد'} className="relative w-full max-w-md h-full overflow-y-auto shadow-2xl p-6" style={{ backgroundColor: 'var(--background)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingRole ? 'تعديل دور' : 'دور جديد'}
              </h3>
              <button onClick={() => setShowDrawer(false)} aria-label="إغلاق" className="p-1.5 rounded-lg hover:bg-[var(--surface)]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>الاسم</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }}
                  placeholder="مثل: مشرف أول" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>الوصف</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3}
                  className="w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 resize-none"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>اللون</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={formColor} onChange={(e) => setFormColor(e.target.value)}
                    className="w-12 h-10 rounded-xl cursor-pointer" />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>الأولوية</label>
                <input type="number" value={formPriority} onChange={(e) => {
                  const v = Number(e.target.value);
                  setFormPriority(Number.isFinite(v) && v >= 0 ? v : 0);
                }}
                  className="w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={handleSave}
                className="flex-1 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all"
                style={{ backgroundColor: 'var(--primary)' }}>
                حفظ
              </button>
              <button onClick={() => setShowDrawer(false)}
                className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl transition-all"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
