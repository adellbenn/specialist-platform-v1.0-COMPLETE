'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FolderOpen, Plus, Search, Trash2, X, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { PermissionGate } from '@/components/auth/permission-gate';
import { cn } from '@/lib/utils';
import { useThemeCustomizer } from '@/store/theme-customizer.store';

const DEFAULT_GROUP_COLOR = useThemeCustomizer.getState().customAccentColor || '#2563EB';

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState(DEFAULT_GROUP_COLOR);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getGroups();
      setGroups(res.data.data);
    } catch {
      toast.error('فشل تحميل المجموعات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  useEffect(() => {
    if (!showDrawer) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDrawer(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showDrawer]);

  const filtered = groups.filter((g) =>
    !search || g.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setEditing(null);
    setFormName(''); setFormDesc(''); setFormColor(DEFAULT_GROUP_COLOR);
    setShowDrawer(true);
  };

  const openEdit = (g: any) => {
    setEditing(g);
    setFormName(g.name); setFormDesc(g.description || ''); setFormColor(g.color);
    setShowDrawer(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('اسم المجموعة مطلوب'); return; }
    try {
      if (editing) {
        await adminService.updateGroup(editing.id, { name: formName, description: formDesc, color: formColor });
        toast.success('تم تحديث المجموعة');
      } else {
        await adminService.createGroup({ name: formName, description: formDesc, color: formColor });
        toast.success('تم إنشاء المجموعة');
      }
      setShowDrawer(false);
      fetchGroups();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل الحفظ');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`حذف "${name}"؟`)) return;
    try {
      await adminService.deleteGroup(id);
      toast.success('تم الحذف');
      fetchGroups();
    } catch { toast.error('فشل الحذف'); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen size={20} style={{ color: 'var(--primary)' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>مجموعات الصلاحيات</h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
            {groups.length} مجموعة
          </span>
        </div>
        <PermissionGate permission="group:create">
          <button onClick={openCreate}
            className="flex items-center gap-1.5 text-white text-sm px-4 py-2 rounded-xl font-medium"
            style={{ backgroundColor: 'var(--primary)' }}>
            <Plus size={14} /> مجموعة جديدة
          </button>
        </PermissionGate>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input type="text" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm rounded-xl pr-9 px-3 py-2 focus:outline-none focus:ring-2"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FolderOpen} title="لا توجد مجموعات" description="لم يتم إنشاء أي مجموعات صلاحيات بعد" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((group) => (
            <div key={group.id}
              className="rounded-xl p-4 transition-all hover:shadow-md"
              style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                    style={{ backgroundColor: group.color }}>
                    {group.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{group.name}</p>
                    {group.description && (
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{group.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                {group.permissions?.length || 0} صلاحية · {group.isSystem ? 'نظامي' : 'مخصص'}
              </p>

              <div className="flex gap-2">
                <button onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                  className="text-xs px-3 py-1.5 rounded-lg transition"
                  style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}>
                  {expandedGroup === group.id ? 'إخفاء' : 'عرض'} الصلاحيات
                </button>
                <button onClick={() => openEdit(group)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition"
                  style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}>
                  تعديل
                </button>
                {!group.isSystem && (
                  <button onClick={() => handleDelete(group.id, group.name)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition"
                    style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              {expandedGroup === group.id && (
                <div className="mt-3 flex flex-wrap gap-1.5 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  {group.permissions?.map((perm: any) => (
                    <span key={perm.id} className="text-[11px] px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
                      {perm.displayName || `${perm.module}:${perm.action}`}
                    </span>
                  ))}
                  {(!group.permissions || group.permissions.length === 0) && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>لا توجد صلاحيات</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0" style={{ backgroundColor: 'var(--overlay)' }} onClick={() => setShowDrawer(false)} />
          <div role="dialog" aria-modal="true" aria-label={editing ? 'تعديل مجموعة' : 'مجموعة جديدة'} className="relative w-full max-w-md h-full overflow-y-auto shadow-2xl p-6" style={{ backgroundColor: 'var(--background)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {editing ? 'تعديل مجموعة' : 'مجموعة جديدة'}
              </h3>
              <button onClick={() => setShowDrawer(false)} aria-label="إغلاق" className="p-1.5 rounded-lg hover:bg-[var(--surface)]">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>الاسم</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>الوصف</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3}
                  className="w-full text-sm rounded-xl px-4 py-2.5 focus:outline-none resize-none"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>اللون</label>
                <input type="color" value={formColor} onChange={(e) => setFormColor(e.target.value)}
                  className="w-12 h-10 rounded-xl cursor-pointer" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={handleSave}
                className="flex-1 text-white text-sm font-medium px-4 py-2.5 rounded-xl"
                style={{ backgroundColor: 'var(--primary)' }}>حفظ</button>
              <button onClick={() => setShowDrawer(false)}
                className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
