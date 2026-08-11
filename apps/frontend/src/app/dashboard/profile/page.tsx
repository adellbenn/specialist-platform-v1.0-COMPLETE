'use client';

import { useState } from 'react';
import { User, Mail, Phone, Briefcase, Building2, Edit3, Quote, X, Check } from 'lucide-react';
import { PageLoader } from '@/components/ui/spinner';
import { useRouteGuard } from '@/components/auth/route-guard';
import { useAuthStore } from '@/store/auth.store';
import { Card } from '@/components/ui/card';
import { ROLE_LABELS, UserRole } from '@/types';
import apiClient from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface EditableField {
  key: string;
  label: string;
  icon: typeof User;
  value: string;
  multiline?: boolean;
}

export default function ProfilePage() {
  useRouteGuard({
    anyRole: ['super_admin', 'center_manager', 'supervisor', 'specialist', 'receptionist', 'accountant'],
    redirectTo: '/dashboard',
  });

  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
  });
  const [saving, setSaving] = useState(false);

  if (!user) return <PageLoader />;

  const fullName = `${user.firstName} ${user.lastName}`;
  const initial = user.firstName?.charAt(0) || user.email?.charAt(0) || '?';
  const roleLabel = ROLE_LABELS[user.role as UserRole] || user.role;
  const tenantName = user.tenant?.name || 'غير محدد';

  const fields: EditableField[] = [
    { key: 'firstName', label: 'الاسم الأول', icon: User, value: user.firstName },
    { key: 'lastName', label: 'اسم العائلة', icon: User, value: user.lastName },
    { key: 'phone', label: 'رقم الهاتف', icon: Phone, value: (user as any).phone || '' },
  ];

  const startEditing = () => {
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: (user as any).phone || '',
      bio: (user as any).bio || '',
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await apiClient.patch('/auth/profile', form);
      const updatedUser = res.data?.data;
      if (updatedUser) {
        setUser(updatedUser);
      }
      setIsEditing(false);
      toast.success('تم حفظ التغييرات');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-5 max-w-2xl relative">
        {/* Page header */}
        <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary shrink-0">
            <User size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-h2 font-semibold text-text-primary">الملف الشخصي</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>عرض وإدارة معلوماتك الشخصية</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card>
          {/* Avatar + Edit/Save button row */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center bg-primary text-white text-2xl font-bold shrink-0">
                {initial}
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{fullName}</h2>
                <p className="text-sm mt-0.5" style={{ color: 'var(--primary)' }}>{roleLabel}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{tenantName}</p>
              </div>
            </div>
            {isEditing ? (
              <div className="flex gap-2">
                <button onClick={cancelEditing} disabled={saving}
                  className="px-4 py-2 text-small font-medium border border-border rounded-lg hover:bg-surface transition-colors">
                  <X size={15} /> إلغاء
                </button>
                <button onClick={saveProfile} disabled={saving}
                  className="flex items-center gap-2 text-white text-small px-4 py-2 rounded-lg transition-colors font-medium bg-primary hover:bg-primary-hover shrink-0 disabled:opacity-50">
                  <Check size={15} /> {saving ? 'حفظ...' : 'حفظ'}
                </button>
              </div>
            ) : (
              <button onClick={startEditing}
                className="flex items-center gap-2 text-white text-small px-4 py-2 rounded-lg transition-colors font-medium bg-primary hover:bg-primary-hover shrink-0">
                <Edit3 size={15} /> تعديل الملف الشخصي
              </button>
            )}
          </div>

          {/* Info fields */}
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="flex items-start gap-3 py-2.5 border-b last:border-0"
                style={{ borderColor: 'var(--border)' }}>
                <field.icon size={15} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{field.label}</p>
                  {isEditing ? (
                    <input
                      value={(form as any)[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      className="w-full text-sm border rounded-xl px-3 py-2"
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  ) : (
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {field.value || 'غير محدد'}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Email - always read-only */}
            <div className="flex items-start gap-3 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <Mail size={15} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
              <div className="min-w-0 flex-1">
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>البريد الإلكتروني</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.email}</p>
              </div>
            </div>

            {/* Role - always read-only */}
            <div className="flex items-start gap-3 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <Briefcase size={15} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
              <div className="min-w-0 flex-1">
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>المسمى الوظيفي</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{roleLabel}</p>
              </div>
            </div>

            {/* Tenant - always read-only */}
            <div className="flex items-start gap-3 py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
              <Building2 size={15} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
              <div className="min-w-0 flex-1">
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>المركز/الفرع</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tenantName}</p>
              </div>
            </div>
          </div>

          {/* Bio section */}
          <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-start gap-3">
              <Quote size={15} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
              <div className="min-w-0 flex-1">
                <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>نبذة شخصية</p>
                {isEditing ? (
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    rows={3}
                    className="w-full text-sm border rounded-2xl px-4 py-2.5 resize-none"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text-primary)',
                    }}
                    placeholder="أهلاً! أنا سعيد بانضمامي إلى المنصة وأتطلع للعمل مع فريقنا المتميز"
                  />
                ) : (
                  <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {(user as any).bio || 'أهلاً! أنا سعيد بانضمامي إلى المنصة وأتطلع للعمل مع فريقنا المتميز'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
