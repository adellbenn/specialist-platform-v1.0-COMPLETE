'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, ArrowLeft } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { useRouteGuard } from '@/components/auth/route-guard';
import { useAuthStore } from '@/store/auth.store';
import { tenantsService } from '@/services/tenants.service';
import { ROLE_LABELS, Tenant } from '@/types';
import toast from 'react-hot-toast';

const ROLES = ['super_admin', 'center_manager', 'supervisor', 'specialist', 'receptionist', 'accountant'] as const;

const isTestTenant = (t: { name?: string; slug?: string }) =>
  /zz[_-]?test/i.test(`${t.name ?? ''} ${t.slug ?? ''}`);

export default function NewUserPage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' });
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'super_admin';

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', role: 'specialist', tenantId: '',
  });
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const showTenantSelect = isSuperAdmin && form.role !== 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin) return;
    let active = true;
    tenantsService
      .getAll({ limit: 100 })
      .then(({ data }) => { if (active) setTenants(data.data || []); })
      .catch(() => { if (active) setTenants([]); });
    return () => { active = false; };
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin || form.tenantId) return;
    const realTenants = tenants.filter((t) => !isTestTenant(t));
    if (realTenants.length === 1) {
      const onlyId = realTenants[0].id;
      setForm((f) => (f.tenantId ? f : { ...f, tenantId: onlyId }));
    }
  }, [tenants, isSuperAdmin, form.tenantId]);

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    if (form.password !== confirmPassword) {
      setPasswordError('كلمة المرور غير متطابقة');
      toast.error('كلمة المرور غير متطابقة');
      return;
    }
    setPasswordError('');
    if (showTenantSelect && !form.tenantId) {
      toast.error('يجب تحديد المركز');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (showTenantSelect) {
        payload.tenantId = form.tenantId;
      } else {
        delete payload.tenantId;
      }
      await apiClient.post('/users', payload);
      toast.success('تم إنشاء المستخدم');
      router.push('/dashboard/users');
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;
      if (status === 400) {
        toast.error(message || 'يجب تحديد المركز');
      } else {
        toast.error(message || 'فشل إنشاء المستخدم');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg transition hover:bg-[var(--surface-secondary)]">
          <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <div className="flex items-center gap-2">
          <UserPlus size={20} style={{ color: 'var(--primary)' }} />
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>مستخدم جديد</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>إنشاء حساب مستخدم جديد في المنصة</p>
          </div>
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>الاسم الأول *</label>
              <input type="text" value={form.firstName} onChange={(e) => update('firstName', e.target.value)}
                className="w-full text-base sm:text-sm max-sm:min-h-11 rounded-lg px-3 py-2"
                style={{ borderColor: 'var(--border)', outline: 'none' }}
                onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
                onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)'; }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>الاسم الأخير *</label>
              <input type="text" value={form.lastName} onChange={(e) => update('lastName', e.target.value)}
                className="w-full text-base sm:text-sm max-sm:min-h-11 rounded-lg px-3 py-2"
                style={{ borderColor: 'var(--border)', outline: 'none' }}
                onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
                onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)'; }} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>البريد الإلكتروني *</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
              className="w-full text-base sm:text-sm max-sm:min-h-11 rounded-lg px-3 py-2"
              style={{ borderColor: 'var(--border)', outline: 'none' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)'; }} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>رقم الهاتف</label>
            <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)}
              className="w-full text-base sm:text-sm max-sm:min-h-11 rounded-lg px-3 py-2"
              style={{ borderColor: 'var(--border)', outline: 'none' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)'; }} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>كلمة المرور *</label>
            <input type="password" value={form.password} onChange={(e) => { update('password', e.target.value); setPasswordError(''); }}
              className="w-full text-base sm:text-sm max-sm:min-h-11 rounded-lg px-3 py-2"
              style={{ borderColor: 'var(--border)', outline: 'none' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)'; }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>تأكيد كلمة المرور *</label>
            <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
              className="w-full text-base sm:text-sm max-sm:min-h-11 rounded-lg px-3 py-2"
              style={{ borderColor: passwordError ? 'var(--danger)' : 'var(--border)', outline: 'none' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = passwordError ? 'var(--danger)' : 'var(--border)'; }} />
            {passwordError && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{passwordError}</p>}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>الدور *</label>
            <select id="role" value={form.role} onChange={(e) => update('role', e.target.value)}
              className="w-full text-base sm:text-sm max-sm:min-h-11 rounded-lg px-3 py-2"
              style={{ borderColor: 'var(--border)', outline: 'none' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)'; }}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {showTenantSelect && (
            <div>
              <label htmlFor="tenant" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>المركز *</label>
              <select id="tenant" value={form.tenantId} onChange={(e) => update('tenantId', e.target.value)}
                className="w-full text-base sm:text-sm max-sm:min-h-11 rounded-lg px-3 py-2"
                style={{ borderColor: 'var(--border)', outline: 'none' }}
                onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
                onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)'; }}>
                <option value="">اختر المركز</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-end pt-2">
            <button onClick={() => router.push('/dashboard/users')}
              className="w-full sm:w-auto text-sm border px-4 py-2 rounded-lg transition hover:bg-[var(--surface-secondary)]"
              style={{ borderColor: 'var(--border)' }}>إلغاء</button>
            <button onClick={handleSubmit} disabled={saving}
              className="w-full sm:w-auto text-sm text-white px-4 py-2 rounded-lg transition disabled:opacity-50 bg-[var(--primary)] hover:bg-[var(--primary-hover)]">
              {saving ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
