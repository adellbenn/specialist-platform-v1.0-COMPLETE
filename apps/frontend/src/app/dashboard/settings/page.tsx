'use client';

import { useState, useEffect } from 'react';
import { Lock, Sun, Bell, Shield, Settings as SettingsIcon, LogOut, Download, Eye } from 'lucide-react';
import QRCode from 'react-qr-code';
import { PageLoader } from '@/components/ui/spinner';
import { useRouteGuard } from '@/components/auth/route-guard';
import { useAuthStore } from '@/store/auth.store';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { Card, SectionHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
];

const DATE_FORMATS = [
  { value: 'gregorian', label: 'ميلادي (YYYY-MM-DD)' },
  { value: 'gregorian-alt', label: 'ميلادي (DD/MM/YYYY)' },
  { value: 'hijri', label: 'هجري' },
];

function Toggle({ enabled, onChange, id }: { enabled: boolean; onChange: (v: boolean) => void; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
      style={{ backgroundColor: enabled ? 'var(--primary)' : 'var(--border)' }}
    >
      <div
        className={cn(
          'absolute top-0.5 start-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200',
          enabled && 'start-[22px]',
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager', 'supervisor', 'specialist', 'receptionist'], redirectTo: '/dashboard' });

  const { user } = useAuthStore();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ secret: string; otpauthUrl: string; backupCodes: string[] } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorPassword, setTwoFactorPassword] = useState('');
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);

  // Language & timezone
  const [language, setLanguage] = useState('ar');
  const [timezone] = useState('(UTC+03:00) الرياض');
  const [dateFormat, setDateFormat] = useState('gregorian');

  // Notifications
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSystem, setNotifSystem] = useState(true);
  const [notifAppointments, setNotifAppointments] = useState(true);
  const [notifReports, setNotifReports] = useState(true);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('يرجى تعبئة جميع حقول كلمة المرور');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }
    setSavingPassword(true);
    try {
      const { default: apiClient } = await import('@/lib/api-client');
      await apiClient.patch('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('تم تغيير كلمة المرور بنجاح');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'فشل تغيير كلمة المرور';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      const { default: apiClient } = await import('@/lib/api-client');
      await apiClient.post('/auth/logout-all');
      toast.success('تم تسجيل الخروج من جميع الأجهزة');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'فشل تسجيل الخروج';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { default: apiClient } = await import('@/lib/api-client');
        const res = await apiClient.get('/auth/2fa/status');
        if (!cancelled) setTwoFactorEnabled(res.data.data?.enabled ?? false);
      } catch {
        /* تجاهل — الخدمة اختيارية */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleEnableTwoFactor = async () => {
    setTwoFactorBusy(true);
    try {
      const { default: apiClient } = await import('@/lib/api-client');
      const res = await apiClient.post('/auth/2fa/generate');
      setTwoFactorSetup(res.data.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'فشل بدء إعداد المصادقة الثنائية';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const handleVerifyTwoFactor = async () => {
    if (!twoFactorCode.trim()) { toast.error('أدخل رمز التحقق'); return; }
    setTwoFactorBusy(true);
    try {
      const { default: apiClient } = await import('@/lib/api-client');
      await apiClient.post('/auth/2fa/verify', { code: twoFactorCode.trim() });
      toast.success('تم تفعيل المصادقة الثنائية');
      setTwoFactorEnabled(true);
      setTwoFactorSetup(null);
      setTwoFactorCode('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'فشل التحقق من الرمز';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!twoFactorPassword) { toast.error('أدخل كلمة المرور الحالية'); return; }
    if (!twoFactorCode.trim()) { toast.error('أدخل رمز التحقق'); return; }
    setTwoFactorBusy(true);
    try {
      const { default: apiClient } = await import('@/lib/api-client');
      await apiClient.post('/auth/2fa/disable', { password: twoFactorPassword, code: twoFactorCode.trim() });
      toast.success('تم تعطيل المصادقة الثنائية');
      setTwoFactorEnabled(false);
      setTwoFactorPassword('');
      setTwoFactorCode('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'فشل تعطيل المصادقة الثنائية';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setTwoFactorBusy(false);
    }
  };

  if (!user) return <PageLoader />;

  return (
    <>
      <div className="space-y-6 max-w-3xl relative">
        {/* Page Header */}
        <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary shrink-0">
            <SettingsIcon size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-h2 font-semibold text-text-primary">إعدادات الحساب</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              إدارة إعدادات الأمان والتفضيلات والإشعارات
            </p>
          </div>
        </div>

        {/* 1. الأمان */}
        <Card>
          <SectionHeader icon={Lock} title="الأمان" subtitle="إدارة كلمة المرور والمصادقة الثنائية" />

          {/* Change Password */}
          <div className="mb-5">
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>تغيير كلمة المرور</h4>
            <div className="space-y-3">
              <input
                type="password" placeholder="كلمة المرور الحالية" value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full text-sm border rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 transition"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              />
              <input
                type="password" placeholder="كلمة المرور الجديدة" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-sm border rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 transition"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              />
              <input
                type="password" placeholder="تأكيد كلمة المرور الجديدة" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-sm border rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 transition"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              />
              <button
                onClick={handlePasswordChange} disabled={savingPassword}
                className="flex items-center gap-2 text-white text-small px-5 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 bg-primary hover:bg-primary-hover"
              >
                {savingPassword ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4" style={{ borderColor: 'var(--border)' }}>
            {/* 2FA */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>المصادقة الثنائية</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {twoFactorEnabled
                    ? 'مفعّلة — يتطلب تسجيل الدخول رمز تحقق إضافي'
                    : 'تعزيز أمان حسابك عبر رمز تحقق إضافي'}
                </p>
              </div>
              {twoFactorEnabled ? (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: 'var(--success-light)', color: 'var(--success-text)' }}
                >
                  مفعّلة
                </span>
              ) : (
                <button
                  onClick={handleEnableTwoFactor}
                  disabled={twoFactorBusy}
                  className="text-xs px-4 py-2 rounded-2xl font-medium text-white transition-colors disabled:opacity-50 bg-primary hover:bg-primary-hover"
                >
                  {twoFactorBusy ? 'جاري التفعيل...' : 'تفعيل'}
                </button>
              )}
            </div>

            {/* 2FA Setup Panel */}
            {twoFactorSetup && (
              <div className="rounded-xl p-4 space-y-4" style={{ backgroundColor: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  1) امسح رمز QR باستخدام تطبيق Authenticator
                </p>
                <div className="flex justify-center bg-white rounded-xl p-3">
                  <QRCode value={twoFactorSetup.otpauthUrl} size={160} />
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  أو أدخل المفتاح يدوياً:{' '}
                  <span dir="ltr" className="font-mono" style={{ color: 'var(--text-primary)' }}>{twoFactorSetup.secret}</span>
                </p>
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    2) رموز الاسترداد — احتفظ بها في مكان آمن:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {twoFactorSetup.backupCodes.map((c) => (
                      <code
                        key={c}
                        dir="ltr"
                        className="text-xs px-2 py-1 rounded-lg text-center"
                        style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}
                      >
                        {c}
                      </code>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    3) أدخل رمز التحقق من التطبيق:
                  </p>
                  <input
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="000000"
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full text-sm px-3 py-2 rounded-lg"
                    style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface-input)', color: 'var(--text-primary)' }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleVerifyTwoFactor}
                      disabled={twoFactorBusy}
                      className="text-xs px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 bg-primary hover:bg-primary-hover"
                    >
                      {twoFactorBusy ? 'جاري التحقق...' : 'تأكيد التفعيل'}
                    </button>
                    <button
                      onClick={() => { setTwoFactorSetup(null); setTwoFactorCode(''); }}
                      className="text-xs px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2FA Disable Panel */}
            {twoFactorEnabled && !twoFactorSetup && (
              <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  لتعطيل المصادقة الثنائية أدخل كلمة المرور الحالية ورمز التحقق:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    value={twoFactorPassword}
                    onChange={(e) => setTwoFactorPassword(e.target.value)}
                    placeholder="كلمة المرور الحالية"
                    className="flex-1 text-sm px-3 py-2 rounded-lg"
                    style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface-input)', color: 'var(--text-primary)' }}
                  />
                  <input
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="رمز التحقق"
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={6}
                    className="flex-1 text-sm px-3 py-2 rounded-lg"
                    style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface-input)', color: 'var(--text-primary)' }}
                  />
                  <button
                    onClick={handleDisableTwoFactor}
                    disabled={twoFactorBusy}
                    className="text-xs px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: 'var(--danger)' }}
                  >
                    {twoFactorBusy ? 'جاري التعطيل...' : 'تعطيل'}
                  </button>
                </div>
              </div>
            )}

            {/* Active Sessions */}
            <div className="flex items-center justify-between gap-3 py-2">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>إدارة الجلسات النشطة</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>لا توجد جلسات نشطة</p>
              </div>
            </div>

            {/* Logout All */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>تسجيل الخروج من جميع الأجهزة</p>
              </div>
              <button
                onClick={handleLogoutAll}
                className="text-xs px-4 py-2 rounded-2xl font-medium transition-colors"
                style={{ color: 'white', backgroundColor: 'var(--danger)' }}
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </Card>

        {/* 2. التفضيلات */}
        <Card>
          <SectionHeader icon={Sun} title="التفضيلات" subtitle="تخصيص تجربتك داخل التطبيق" />

          <div className="space-y-4">
            {/* Theme */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>الوضع الفاتح/الداكن</p>
              <ThemeSwitcher variant="full" />
            </div>

            {/* Language */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>اللغة</p>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-sm border rounded-2xl px-4 py-2 min-w-[140px] focus:outline-none focus:ring-2 transition"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* Timezone */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>المنطقة الزمنية</p>
              <input
                type="text" value={timezone} readOnly
                className="text-sm border rounded-2xl px-4 py-2 min-w-[200px] focus:outline-none focus:ring-2 transition"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Date Format */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>تنسيق التاريخ والوقت</p>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="text-sm border rounded-2xl px-4 py-2 min-w-[180px] focus:outline-none focus:ring-2 transition"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }}
              >
                {DATE_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* 3. الإشعارات */}
        <Card>
          <SectionHeader icon={Bell} title="الإشعارات" subtitle="التحكم في إشعارات التطبيق" />

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>إشعارات البريد الإلكتروني</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>استلام إشعارات على البريد الإلكتروني</p>
              </div>
              <Toggle enabled={notifEmail} onChange={setNotifEmail} />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>إشعارات النظام</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>إشعارات داخل التطبيق</p>
              </div>
              <Toggle enabled={notifSystem} onChange={setNotifSystem} />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>إشعارات المواعيد</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>تذكير بالمواعيد القادمة</p>
              </div>
              <Toggle enabled={notifAppointments} onChange={setNotifAppointments} />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>إشعارات التقارير</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>عند اكتمال أو اعتماد التقارير</p>
              </div>
              <Toggle enabled={notifReports} onChange={setNotifReports} />
            </div>
          </div>
        </Card>

        {/* 4. الخصوصية */}
        <Card>
          <SectionHeader icon={Shield} title="الخصوصية" subtitle="إعدادات الخصوصية وإدارة بيانات الحساب" />

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>إعدادات الخصوصية</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>التحكم في إعدادات خصوصية حسابك</p>
              </div>
              <button
                className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-2xl font-medium transition-all"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
              >
                <Eye size={14} /> عرض
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>إدارة بيانات الحساب</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>مراجعة وتنزيل بيانات حسابك</p>
              </div>
              <button
                className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-2xl font-medium transition-all"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
              >
                <Download size={14} /> إدارة
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>تصدير البيانات</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>تصدير جميع بيانات حسابك</p>
              </div>
              <button
                className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-2xl font-medium transition-all"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
              >
                <Download size={14} /> تصدير
              </button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
