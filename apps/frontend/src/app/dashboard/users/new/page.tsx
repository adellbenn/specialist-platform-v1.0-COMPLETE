'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, ArrowLeft } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { useRouteGuard } from '@/components/auth/route-guard';
import { ROLE_LABELS } from '@/types';
import toast from 'react-hot-toast';

const ROLES = ['super_admin', 'center_manager', 'supervisor', 'specialist', 'receptionist', 'accountant'] as const;

export default function NewUserPage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager'], redirectTo: '/dashboard' });
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', role: 'specialist',
  });
  const [saving, setSaving] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

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
    setSaving(true);
    try {
      await apiClient.post('/users', form);
      toast.success('تم إنشاء المستخدم');
      router.push('/dashboard/users');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل إنشاء المستخدم');
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>الاسم الأول *</label>
              <input type="text" value={form.firstName} onChange={(e) => update('firstName', e.target.value)}
                className="w-full text-sm rounded-lg px-3 py-2"
                style={{ borderColor: 'var(--border)', outline: 'none' }}
                onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
                onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)'; }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>الاسم الأخير *</label>
              <input type="text" value={form.lastName} onChange={(e) => update('lastName', e.target.value)}
                className="w-full text-sm rounded-lg px-3 py-2"
                style={{ borderColor: 'var(--border)', outline: 'none' }}
                onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
                onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)'; }} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>البريد الإلكتروني *</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
              className="w-full text-sm rounded-lg px-3 py-2"
              style={{ borderColor: 'var(--border)', outline: 'none' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)'; }} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>رقم الهاتف</label>
            <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)}
              className="w-full text-sm rounded-lg px-3 py-2"
              style={{ borderColor: 'var(--border)', outline: 'none' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)'; }} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>كلمة المرور *</label>
            <input type="password" value={form.password} onChange={(e) => { update('password', e.target.value); setPasswordError(''); }}
              className="w-full text-sm rounded-lg px-3 py-2"
              style={{ borderColor: 'var(--border)', outline: 'none' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)'; }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>تأكيد كلمة المرور *</label>
            <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
              className="w-full text-sm rounded-lg px-3 py-2"
              style={{ borderColor: passwordError ? 'var(--danger)' : 'var(--border)', outline: 'none' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = passwordError ? 'var(--danger)' : 'var(--border)'; }} />
            {passwordError && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{passwordError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>الدور *</label>
            <select value={form.role} onChange={(e) => update('role', e.target.value)}
              className="w-full text-sm rounded-lg px-3 py-2"
              style={{ borderColor: 'var(--border)', outline: 'none' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--primary)'; e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)'; }}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => router.push('/dashboard/users')}
              className="text-sm border px-4 py-2 rounded-lg transition hover:bg-[var(--surface-secondary)]"
              style={{ borderColor: 'var(--border)' }}>إلغاء</button>
            <button onClick={handleSubmit} disabled={saving}
              className="text-sm text-white px-4 py-2 rounded-lg transition disabled:opacity-50 bg-[var(--primary)] hover:bg-[var(--primary-hover)]">
              {saving ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
