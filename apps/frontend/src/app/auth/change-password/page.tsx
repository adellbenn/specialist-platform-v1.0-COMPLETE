'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Lock, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import apiClient from '@/lib/api-client';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { logout, clearMustChangePassword } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('يرجى تعبئة جميع حقول كلمة المرور');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }
    if (newPassword.length < 8) {
      setError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiClient.patch('/auth/change-password', { currentPassword, newPassword });
      clearMustChangePassword();
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'فشل تغيير كلمة المرور';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" dir="rtl" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[24px] mb-5 shadow-card bg-primary">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">تغيير كلمة المرور</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            يجب تغيير كلمة المرور قبل متابعة استخدام المنصة
          </p>
        </div>

        <div className="rounded-[24px] shadow-modal p-8" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                كلمة المرور الحالية
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-required="true"
                className="w-full px-4 py-3 border-2 rounded-lg text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-required="true"
                  className="w-full px-4 py-3 border-2 rounded-lg text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 pl-10"
                  style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                تأكيد كلمة المرور الجديدة
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-required="true"
                className="w-full px-4 py-3 border-2 rounded-lg text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>

            {error && <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
              aria-busy={loading || undefined}
              className="w-full text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 bg-primary hover:bg-primary-hover"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الحفظ...</>
              ) : (
                'حفظ كلمة المرور الجديدة'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <LogOut size={16} />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
