'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError('الرابط غير صالح');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('كلمة المرور غير متطابقة'); return; }
    if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    setLoading(true); setError('');
    try {
      const { default: apiClient } = await import('@/lib/api-client');
      await apiClient.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل إعادة تعيين كلمة المرور');
    } finally { setLoading(false); }
  };

  if (!token && !error) return null;

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" dir="rtl" style={{ backgroundColor: 'var(--background)' }}>
        <div className="w-full max-w-md relative z-10">
          <div className="rounded-[24px] shadow-modal p-8 text-center" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'var(--primary-50)' }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--primary)' }} />
            </div>
            <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>تم إعادة تعيين كلمة المرور</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-300 bg-primary hover:bg-primary-hover text-sm"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" dir="rtl" style={{ backgroundColor: 'var(--background)' }}>
        <div className="w-full max-w-md relative z-10">
          <div className="rounded-[24px] shadow-modal p-8 text-center" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
            <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--danger)' }} />
            <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>رابط غير صالح</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية</p>
            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium transition-colors hover:text-danger"
              style={{ color: 'var(--primary)' }}
            >
              طلب رابط جديد
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" dir="rtl" style={{ backgroundColor: 'var(--background)' }}>
        <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[24px] mb-5 shadow-card bg-primary">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-h2 font-semibold text-text-primary">إعادة تعيين كلمة المرور</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>أدخل كلمة المرور الجديدة</p>
        </div>
        <div className="rounded-[24px] shadow-modal p-8" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>كلمة المرور الجديدة</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 border-2 rounded-lg text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 pl-10"
                  style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--primary-light)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>تأكيد كلمة المرور</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                  className="w-full px-4 py-3 border-2 rounded-lg text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--primary-light)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            {error && <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 bg-primary hover:bg-primary-hover active:shadow-modal"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ إعادة التعيين...</> : 'إعادة تعيين كلمة المرور'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
