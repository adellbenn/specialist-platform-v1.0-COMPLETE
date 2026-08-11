'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl" style={{ backgroundColor: 'var(--background)' }}>
        <div className="w-full max-w-md">
          <div className="rounded-2xl shadow-card p-8 text-center" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'var(--status-success-light)' }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--status-success)' }} />
            </div>
            <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>تم الإرسال</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              إذا كان البريد مسجلاً، ستصل لك رابط إعادة تعيين كلمة المرور
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              <ArrowRight size={16} />
              العودة لتسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-primary">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-h1 font-semibold text-text-primary">نسيت كلمة المرور؟</h1>
          <p className="text-body text-text-secondary mt-1">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>
        </div>

        <div className="rounded-xl border border-border bg-background p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="forgot-email" className="block text-small font-medium text-text-primary mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@clinic.com"
                  required
                  aria-required="true"
                  className="w-full pr-9 pl-4 py-2 text-small border rounded-lg transition-colors duration-150 bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary hover:border-border-hover"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full text-white font-medium py-2 rounded-lg transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-40 bg-primary hover:bg-primary-hover active:bg-primary-hover/90 shadow-xs hover:shadow-sm"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الإرسال...</>
              ) : (
                'إرسال رابط إعادة التعيين'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-small text-primary hover:text-primary-hover transition-colors font-medium">
              العودة لتسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
