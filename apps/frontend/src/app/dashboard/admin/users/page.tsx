'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Shield, Key, X, Clock, CheckCircle, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import { usersService } from '@/services/users.service';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useRouteGuard } from '@/components/auth/route-guard';
import { cn } from '@/lib/utils';

export default function AdminUsersPage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' });

  const [users, setUsers] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userPerms, setUserPerms] = useState<{ granted: any[]; denied: any[] } | null>(null);
  const [viewPerms, setViewPerms] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, permRes] = await Promise.all([
        usersService.getAll({}),
        adminService.getPermissions(),
      ]);
      setUsers(usersRes.data.data);
      setPermissions(permRes.data.data);
    } catch {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openUserOverrides = async (user: any) => {
    setSelectedUser(user);
    setViewPerms(true);
    try {
      const res = await adminService.getUserEffective(user.id || user.userId);
      setUserPerms(res.data.data);
    } catch {
      toast.error('فشل تحميل صلاحيات المستخدم');
      setUserPerms(null);
    }
  };

  const handleOverride = async (permId: string, type: 'granted' | 'denied') => {
    if (!selectedUser) return;
    try {
      const existing = userPerms?.[type === 'granted' ? 'denied' : 'granted']?.find((p) => p.id === permId);
      if (existing) {
        await adminService.removeOverride(selectedUser.id || selectedUser.userId, permId);
      }
      await adminService.setOverride(selectedUser.id || selectedUser.userId, permId, type);
      toast.success(`تم ${type === 'granted' ? 'منح' : 'حرمان'} الصلاحية`);
      const res = await adminService.getUserEffective(selectedUser.id || selectedUser.userId);
      setUserPerms(res.data.data);
    } catch {
      toast.error('فشل تحديث التجاوز');
    }
  };

  const handleRemoveOverride = async (permId: string) => {
    if (!selectedUser) return;
    try {
      await adminService.removeOverride(selectedUser.id || selectedUser.userId, permId);
      toast.success('تم إزالة التجاوز');
      const res = await adminService.getUserEffective(selectedUser.id || selectedUser.userId);
      setUserPerms(res.data.data);
    } catch {
      toast.error('فشل إزالة التجاوز');
    }
  };

  if (loading) return <PageLoader />;

  const selectedUserName = selectedUser
    ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() ||
      selectedUser.email ||
      'مستخدم'
    : '';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Users size={20} style={{ color: 'var(--primary)' }} />
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>صلاحيات المستخدمين</h2>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input type="text" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm rounded-xl pr-9 px-3 py-2 focus:outline-none focus:ring-2"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }} />
      </div>

      <div className="space-y-2">
        {users.map((user: any) => {
          const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'مستخدم';
          if (search && !name.toLowerCase().includes(search.toLowerCase())
            && !(user.email || '').toLowerCase().includes(search.toLowerCase())) return null;
          return (
            <div key={user.id}
              className="rounded-xl p-4 transition hover:shadow-sm"
              style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: 'var(--primary)' }}>
                  {name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email || ''}</p>
                </div>
                <button onClick={() => openUserOverrides(user)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}>
                  <Key size={12} /> إدارة الصلاحيات
                </button>
              </div>
            </div>
          );
        })}
        {users.length === 0 && (
          <EmptyState icon={Users} title="لا يوجد مستخدمون" description="لم يتم العثور على مستخدمين" />
        )}
      </div>

      {/* User Overrides Panel */}
      {viewPerms && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0" style={{ backgroundColor: 'var(--overlay)' }} onClick={() => setViewPerms(false)} />
          <div className="relative w-full max-w-lg h-full overflow-y-auto shadow-2xl p-6" style={{ backgroundColor: 'var(--background)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                صلاحيات: {selectedUserName}
              </h3>
              <button onClick={() => setViewPerms(false)} className="p-1.5 rounded-lg hover:bg-[var(--surface)]">
                <X size={18} />
              </button>
            </div>

            {!userPerms ? (
              <PageLoader />
            ) : (
              <div className="space-y-6">
                <div className="rounded-xl p-4" style={{ border: '1px solid var(--border)' }}>
                  <h4 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--success)' }}>
                    <CheckCircle size={14} /> الصلاحيات الممنوحة ({userPerms.granted.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {userPerms.granted.map((perm: any) => (
                      <span key={perm.id}
                        className="text-[11px] px-2 py-1 rounded-md flex items-center gap-1"
                        style={{ backgroundColor: 'var(--success-light)', color: 'var(--success-text)' }}>
                        {perm.displayName || perm.key}
                        <button onClick={() => handleRemoveOverride(perm.id)} className="hover:opacity-70">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    {userPerms.granted.length === 0 && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>لا توجد صلاحيات ممنوحة بشكل خاص</span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl p-4" style={{ border: '1px solid var(--border)' }}>
                  <h4 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--danger)' }}>
                    <XCircle size={14} /> الصلاحيات المحرومة ({userPerms.denied.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {userPerms.denied.map((perm: any) => (
                      <span key={perm.id}
                        className="text-[11px] px-2 py-1 rounded-md flex items-center gap-1"
                        style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
                        {perm.displayName || perm.key}
                        <button onClick={() => handleRemoveOverride(perm.id)} className="hover:opacity-70">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    {userPerms.denied.length === 0 && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>لا توجد صلاحيات محرومة بشكل خاص</span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl p-4" style={{ border: '1px solid var(--border)' }}>
                  <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>جميع الصلاحيات</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {permissions.map((perm: any) => {
                      const isGranted = userPerms.granted.some((p: any) => p.id === perm.id);
                      const isDenied = userPerms.denied.some((p: any) => p.id === perm.id);
                      return (
                        <button key={perm.id} onClick={() => handleOverride(perm.id, isDenied ? 'granted' : 'denied')}
                          className="text-[11px] px-2 py-1 rounded-md transition-all"
                          style={{
                            backgroundColor: isGranted ? 'var(--success-light)' : isDenied ? 'var(--danger-light)' : 'var(--surface)',
                            color: isGranted ? 'var(--success-text)' : isDenied ? 'var(--danger)' : 'var(--text-muted)',
                          }}>
                          {perm.displayName || perm.key}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
