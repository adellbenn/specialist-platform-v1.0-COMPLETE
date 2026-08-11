'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Building2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      toast.success('مرحباً بك!');
      router.push('/dashboard');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'فشل تسجيل الدخول';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-primary">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-h1 font-semibold text-text-primary">منصة إدارة الأخصائيين</h1>
          <p className="text-body text-text-secondary mt-1">سجّل دخولك للمتابعة</p>
        </div>

        <div className="rounded-xl border border-border bg-background p-6 shadow-card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-small font-medium text-text-primary mb-1.5">
                البريد الإلكتروني
              </label>
              <input
                {...register('email')}
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="example@clinic.com"
                aria-required="true"
                aria-invalid={errors.email ? 'true' : undefined}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                className="w-full px-3 py-2 text-small border rounded-lg transition-colors duration-150 bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary hover:border-border-hover"
                style={{
                  borderColor: errors.email ? 'var(--danger)' : 'var(--border)',
                }}
              />
              {errors.email && (
                <p id="login-email-error" className="mt-1 text-xs text-danger">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-small font-medium text-text-primary mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-required="true"
                  aria-invalid={errors.password ? 'true' : undefined}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  className="w-full px-3 py-2 text-small border rounded-lg transition-colors duration-150 bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary hover:border-border-hover pl-9"
                  style={{
                    borderColor: errors.password ? 'var(--danger)' : 'var(--border)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p id="login-password-error" className="mt-1 text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

            <div className="flex justify-between items-center">
              <Link
                href="/auth/forgot-password"
                className="text-small text-primary hover:text-primary-hover transition-colors"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading || undefined}
              className="w-full text-white font-medium py-2 rounded-lg transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-40 bg-primary hover:bg-primary-hover active:bg-primary-hover/90 shadow-xs hover:shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جارٍ تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-small text-text-muted mt-6">
          منصة إدارة أدوار الأخصائيين — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
