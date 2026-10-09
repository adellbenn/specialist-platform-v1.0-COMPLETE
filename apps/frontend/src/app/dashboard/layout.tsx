'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, UserCheck, UserCircle, Calendar, FileText,
  CreditCard, Bell, Settings, LogOut, Menu, User, Lock, Globe, Moon,
  Building2, ChevronDown, BarChart3, FolderOpen,
  Eye, Search, Shield, Clock, TrendingUp, ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { usePermissionsStore } from '@/store/permissions.store';
import { usePermissions } from '@/hooks/use-permissions';
import { resolveRoutePolicy } from '@/lib/route-policy';
import { GlobalSearch } from '@/components/shared/global-search';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { ThemeSync } from '@/components/ui/theme-sync';
import { PageSkeleton } from '@/components/ui/skeleton';

import { ROLE_LABELS, UserRole } from '@/types';
import { useTranslation, LanguageProvider } from '@/lib/i18n';
import toast from 'react-hot-toast';

interface NavItem {
  href: string;
  label: string;
  labelEn: string;
  icon: React.ElementType;
  roles: UserRole[];
  writeOnly?: boolean;
}

interface NavSection {
  title: string;
  titleEn: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: '',
    titleEn: '',
    items: [
      {
        href: '/dashboard',
        label: 'لوحة التحكم',
        labelEn: 'Dashboard',
        icon: LayoutDashboard,
        roles: ['super_admin', 'center_manager', 'supervisor', 'specialist', 'receptionist'],
      },
      {
        href: '/dashboard/search',
        label: 'البحث',
        labelEn: 'Search',
        icon: Search,
        roles: ['super_admin', 'center_manager', 'supervisor', 'specialist', 'receptionist'],
      },
    ],
  },
  {
    title: '',
    titleEn: '',
    items: [
      {
        href: '/dashboard/beneficiaries',
        label: 'المستفيدون',
        labelEn: 'Beneficiaries',
        icon: UserCircle,
        roles: ['super_admin', 'center_manager', 'supervisor', 'specialist', 'receptionist'],
      },
      {
        href: '/dashboard/specialists',
        label: 'الأخصائيون',
        labelEn: 'Specialists',
        icon: UserCheck,
        roles: ['super_admin', 'center_manager', 'supervisor'],
      },
      {
        href: '/dashboard/users',
        label: 'الموظفون',
        labelEn: 'Staff',
        icon: Users,
        roles: ['super_admin', 'center_manager'],
      },
    ],
  },
  {
    title: '',
    titleEn: '',
    items: [
      {
        href: '/dashboard/appointments',
        label: 'المواعيد',
        labelEn: 'Appointments',
        icon: Calendar,
        roles: ['super_admin', 'center_manager', 'supervisor', 'specialist', 'receptionist'],
      },
      {
        href: '/dashboard/sessions',
        label: 'الجلسات',
        labelEn: 'Sessions',
        icon: Clock,
        roles: ['super_admin', 'center_manager', 'supervisor', 'specialist'],
      },
    ],
  },
  {
    title: 'المالية',
    titleEn: 'Finance',
    items: [
      {
        href: '/dashboard/payments',
        label: 'المدفوعات',
        labelEn: 'Payments',
        icon: CreditCard,
        roles: ['super_admin', 'center_manager', 'accountant'],
      },
      {
        href: '/dashboard/payments/new-invoice',
        label: 'الفواتير',
        labelEn: 'Invoices',
        icon: FileText,
        roles: ['super_admin', 'center_manager', 'accountant'],
      },
    ],
  },
  {
    title: '',
    titleEn: '',
    items: [
      {
        href: '/dashboard/reports',
        label: 'التقارير',
        labelEn: 'Reports',
        icon: BarChart3,
        roles: ['super_admin', 'center_manager', 'supervisor', 'specialist'],
      },
      {
        href: '/dashboard/analytics',
        label: 'الإحصائيات',
        labelEn: 'Analytics',
        icon: TrendingUp,
        roles: ['super_admin', 'center_manager'],
      },
    ],
  },
  {
    title: '',
    titleEn: '',
    items: [
      {
        href: '/dashboard/files',
        label: 'المستندات',
        labelEn: 'Documents',
        icon: FolderOpen,
        roles: ['super_admin', 'center_manager', 'supervisor', 'specialist'],
      },
    ],
  },
  {
    title: '',
    titleEn: '',
    items: [
      {
        href: '/dashboard/notifications',
        label: 'الإشعارات',
        labelEn: 'Notifications',
        icon: Bell,
        roles: ['super_admin', 'center_manager', 'supervisor', 'specialist', 'receptionist'],
      },
    ],
  },
  {
    title: '',
    titleEn: '',
    items: [
      {
        href: '/dashboard/admin/users',
        label: 'إدارة المستخدمين',
        labelEn: 'User Management',
        icon: User,
        roles: ['super_admin', 'center_manager'],
      },
      {
        href: '/dashboard/admin/roles',
        label: 'الصلاحيات والأدوار',
        labelEn: 'Roles & Permissions',
        icon: Shield,
        roles: ['super_admin', 'center_manager'],
      },
      {
        href: '/dashboard/audit',
        label: 'سجل التدقيق',
        labelEn: 'Audit Logs',
        icon: ClipboardList,
        roles: ['super_admin', 'center_manager'],
        writeOnly: true,
      },
    ],
  },
  {
    title: '',
    titleEn: '',
    items: [
      {
        href: '/dashboard/settings',
        label: 'الإعدادات',
        labelEn: 'Settings',
        icon: Settings,
        roles: ['super_admin', 'center_manager', 'supervisor', 'specialist', 'receptionist'],
      },
    ],
  },
];

function DropdownItem({ icon: Icon, label, href, onClick }: { icon: React.ElementType; label: string; href?: string; onClick?: () => void }) {
  const content = (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-[10px] transition-all duration-200"
      style={{ color: 'var(--text-primary)' }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <Icon size={16} style={{ color: 'var(--text-muted)' }} />
      {label}
    </button>
  );
  if (href) return <Link href={href} onClick={onClick}>{content}</Link>;
  return content;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'لوحة التحكم',
  '/dashboard/search': 'بحث',
  '/dashboard/specialists': 'الأخصائيون',
  '/dashboard/beneficiaries': 'المستفيدون',
  '/dashboard/appointments': 'المواعيد',
  '/dashboard/sessions': 'الجلسات',
  '/dashboard/files': 'المستندات',
  '/dashboard/payments': 'المدفوعات',
  '/dashboard/payments/new-invoice': 'الفواتير',
  '/dashboard/reports': 'التقارير',
  '/dashboard/analytics': 'الإحصائيات',
  '/dashboard/users': 'الموظفون',
  '/dashboard/admin/users': 'إدارة المستخدمين',
  '/dashboard/admin/roles': 'الصلاحيات والأدوار',
  '/dashboard/audit': 'سجل التدقيق',
  '/dashboard/settings': 'الإعدادات',
  '/dashboard/profile': 'الملف الشخصي',
  '/dashboard/notifications': 'الإشعارات',
};

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout, refreshUser, _hydrated, mustChangePassword } = useAuthStore();
  const { isAdmin, isSuperAdmin, canWrite, can, canAny, hasRole, hasAnyRole, hasAuthority } = usePermissions();
  const { fetchPermissions, clearPermissions } = usePermissionsStore();
  const permissionStatus = usePermissionsStore((s) => s.status);
  const permissionError  = usePermissionsStore((s) => s.error);
  const { t, locale, setLocale, dir } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  /* ── نقطة فرض الصلاحيات الوحيدة ──
     `hasAuthority` صحيحة فقط عندما تكون حالة المخزن `ready` ولصاحبها نفس
     الهوية والدور المعروضين الآن. أي حالة أخرى — idle / loading / revoked /
     error أو مالك مختلف — تمنع تركيب children ولا تُطلق طلباتها إطلاقًا.

     `allowedPath` يتتبّع المسار الذي مُنح له، فإذا تغيّر pathname قبل وصول
     تفويض جديد تُحجب children فورًا ولا تُورَّث موافقة المسار السابق. */
  const policy = useMemo(() => resolveRoutePolicy(pathname), [pathname]);
  /* شكل الـskeleton يتبع الصفحة الهدف: تقويم للمواعيد، بطاقات لصفحات أخرى،
     جدول لبقية القوائم. الشكل غير المطابق يجعل التخطيط يقفز عند أول رسم. */
  const skeletonVariant = useMemo<'table' | 'list' | 'calendar'>(() => {
    if (pathname.startsWith('/dashboard/appointments')) return 'calendar';
    if (pathname.startsWith('/dashboard/beneficiaries') || pathname.startsWith('/dashboard/sessions')) return 'list';
    return 'table';
  }, [pathname]);
  const [allowedPath, setAllowedPath] = useState('');
  /* `isAuthenticated` شرط مستقل عن `hasAuthority`: `auth` مُخزَّن، فقد يبقى
     `user` محفوظًا بينما `isAuthenticated` صار false. الاعتماد على
     `hasAuthority` وحده كان يركّب children في تلك النافذة. */
  const routeBlocked =
    !isAuthenticated || !hasAuthority || allowedPath !== pathname || mustChangePassword;

  const userId   = user?.id ?? null;
  const userRole = user?.role ?? null;

  useEffect(() => {
    setMounted(true);
  }, []);

  /* جلب واحد لكل (هوية + دور). إضافة الهوية إلى التبعيات هي ما يجعل تغيّر
     الدور أو الحساب يُبطل السلطة القديمة ويجلب بدلاً منها. */
  useEffect(() => {
    if (!_hydrated) return;
    if (!isAuthenticated || !userId) {
      clearPermissions();
      router.push('/auth/login');
      return;
    }
    refreshUser();
    fetchPermissions({ id: userId, role: userRole ?? '' });
  }, [_hydrated, isAuthenticated, userId, userRole, clearPermissions, refreshUser, fetchPermissions, router]);

  /* مستخدم مُلزَم بتغيير كلمة المرور لا يُسمح له بالبقاء داخل اللوحة. */
  useEffect(() => {
    if (_hydrated && isAuthenticated && mustChangePassword) {
      router.replace('/auth/change-password');
    }
  }, [_hydrated, isAuthenticated, mustChangePassword, router]);

  /* فشل الجلب = لا سلطة. لا محاولة تلقائية: أي إعادة محاولة مؤجَّلة تُنتج
     حالة مخفية يصعب إثبات حدودها، والفشل العابر لا يستحق طرد المستخدم من
     الواجهة. البديل زر إعادة صريح — القرار يبقى مرئيًا وقابلًا للقياس.
     مهمته الوحيدة: إعادة الجلب للهوية نفسها. */
  const retryPermissions = () => {
    if (userId) fetchPermissions({ id: userId, role: userRole ?? '' });
  };


  useEffect(() => {
    /* لا قرار تفويض إطلاقًا قبل وجود جلسة وسلطة: لا تحويل ولا ترخيص */
    if (!_hydrated || !isAuthenticated || !hasAuthority) { setAllowedPath(''); return; }

    /* لا مسار داخل /dashboard مفتوح افتراضياً: سياسة بلا أدوار = رفض. */
    let allowed = true;
    if (policy.permission    && !can(policy.permission))            allowed = false;
    if (policy.anyPermission && !canAny(...policy.anyPermission))  allowed = false;
    if (policy.role          && !hasRole(policy.role))              allowed = false;
    if (policy.anyRole       && !hasAnyRole(...policy.anyRole))    allowed = false;

    setAllowedPath(allowed ? pathname : '');
    if (!allowed) router.replace(policy.redirectTo ?? '/dashboard');
  }, [pathname, policy, hasAuthority, can, canAny, hasRole, hasAnyRole, router]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const handleLogout = () => {
    /* الإبطال يحدث داخل `authStore.logout()` — مصدر واحد لكل مساراتLogout. */
    logout();
    toast.success('تم تسجيل الخروج بنجاح');
    router.push('/auth/login');
  };

  const visibleSections = NAV_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!user) return false;
        if (!item.roles.includes(user.role)) return false;
        if (item.writeOnly && !canWrite) return false;
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);

  const Sidebar = () => (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}>
      <div className="flex items-center gap-3 px-5 h-16 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--primary)' }}>
          <Building2 size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-tight truncate">{user?.tenant?.name || 'المنصة'}</p>
          <p className="text-xs leading-tight mt-0.5 truncate" style={{ color: 'var(--sidebar-text-muted)' }}>{user ? ROLE_LABELS[user.role] : ''}</p>
        </div>
        {isAdmin && !isSuperAdmin && (
          <Eye size={14} style={{ color: 'var(--sidebar-text-muted)' }} />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {visibleSections.map((section, idx) => (
          <div key={idx}>
            {section.title && (
              <p className="px-3 pb-1 text-xs font-medium tracking-wider" style={{ color: 'var(--sidebar-text-muted)' }}>
                {locale === 'en' ? section.titleEn : section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200"
                    style={{
                      backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                      color: isActive ? '#fff' : 'var(--sidebar-text-muted)',
                    }}
                    onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'; e.currentTarget.style.color = 'var(--sidebar-text)'; } }}
                    onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text-muted)'; } }}
                  >
                    <Icon size={18} />
                    <span>{locale === 'en' ? item.labelEn : item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden" dir={dir} style={{ backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
      <ThemeSync />

      {/* Desktop Sidebar */}
      {!sidebarCollapsed && (
        <aside className="hidden lg:flex flex-shrink-0 w-[280px]">
          <Sidebar />
        </aside>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0" style={{ backgroundColor: 'var(--overlay)' }} onClick={() => setSidebarOpen(false)} />
          <aside className="absolute right-0 top-0 h-full z-50 flex">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header
          className="flex items-center flex-shrink-0 px-6 border-b relative"
          style={{
            backgroundColor: 'var(--navbar-bg)',
            borderColor: 'var(--navbar-border)',
            height: '72px',
          }}
        >


          {/* ─── LEFT: 25% — Sidebar toggle + Page title ─── */}
          <div className="flex items-center gap-4" style={{ width: '25%', minWidth: 0 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-[10px] transition-all duration-200 hover:bg-[var(--surface)] flex-shrink-0"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Menu size={20} />
            </button>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center justify-center w-10 h-10 rounded-[10px] transition-all duration-200 hover:bg-[var(--surface)] flex-shrink-0"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {PAGE_TITLES[pathname] || 'لوحة التحكم'}
            </h1>
          </div>

          {/* ─── CENTER: 45% — Search bar ─── */}
          <div className="hidden lg:flex items-center justify-center" style={{ width: '45%' }}>
            <div style={{ width: 'min(420px, 100%)' }}>
              <GlobalSearch />
            </div>
          </div>

          {/* ─── RIGHT: 30% — Theme + Notifications + | + User ─── */}
          <div className="flex items-center justify-end gap-5" style={{ width: '30%', minWidth: 0 }}>
            {/* Monitoring badge */}
            {isAdmin && !isSuperAdmin && (
              <div className="hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border flex-shrink-0 border-warning/30 bg-warning-light text-warning">
                <Eye size={12} />
                <span>{t('sidebar.monitoring_badge')}</span>
              </div>
            )}

            {/* Theme toggle */}
            <div className="flex items-center justify-center w-10 h-10 rounded-[10px] flex-shrink-0">
              <ThemeSwitcher variant="icon" />
            </div>

            {/* Notifications */}
            <Link href="/dashboard/notifications" aria-label="الإشعارات"
              className="flex items-center justify-center w-10 h-10 rounded-[10px] transition-all duration-200 hover:bg-[var(--surface)] flex-shrink-0"
              style={{ color: 'var(--text-secondary)' }}>
              <span className="relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-danger" />
              </span>
            </Link>

            {/* Vertical Divider */}
            <div className="w-px h-8 flex-shrink-0" style={{ backgroundColor: 'var(--border)' }} />

            {/* User Profile */}
            <div ref={userMenuRef} className="relative flex-shrink-0">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 h-10 rounded-[10px] px-2 transition-all duration-200 hover:bg-[var(--surface)]"
                style={{ color: 'var(--text-primary)' }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 bg-primary text-white shadow-xs">
                  {user?.firstName?.[0]}
                </div>
                <div className="hidden lg:block text-right">
                  <p className="text-sm font-semibold leading-tight truncate max-w-[140px]">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs leading-tight mt-0.5 truncate max-w-[140px]" style={{ color: 'var(--text-muted)' }}>{user?.role ? ROLE_LABELS[user.role] : ''}</p>
                </div>
                <ChevronDown size={16} className={`hidden lg:block transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-64 rounded-[12px] border shadow-lg z-50 overflow-hidden animate-fade-in"
                  style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                >
                  {/* User Info Header */}
                  <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 bg-primary text-white shadow-xs">
                      {user?.firstName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{user?.role ? ROLE_LABELS[user.role] : ''}</p>
                    </div>
                  </div>

                  {/* Menu */}
                  <div className="p-1.5">
                    <DropdownItem icon={User} label="👤 الملف الشخصي" href="/dashboard/profile" onClick={() => setUserMenuOpen(false)} />
                    <DropdownItem icon={Settings} label="⚙️ إعدادات الحساب" href="/dashboard/settings" onClick={() => setUserMenuOpen(false)} />
                    <DropdownItem icon={Lock} label="🔒 تغيير كلمة المرور" onClick={() => { setUserMenuOpen(false); toast('قريباً...'); }} />
                  </div>

                  <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="p-1.5">
                      <DropdownItem icon={Globe} label="🌐 اللغة — English" onClick={() => { setUserMenuOpen(false); setLocale(locale === 'ar' ? 'en' : 'ar'); }} />
                      <DropdownItem icon={Moon} label="🌙 المظهر" onClick={() => { setUserMenuOpen(false); }} />
                    </div>
                  </div>

                  <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="p-1.5">
                      <button
                        onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-[10px] transition-all duration-200"
                        style={{ color: 'var(--danger)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <LogOut size={16} />
                        🚪 تسجيل الخروج
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6" style={{ backgroundColor: 'var(--background)' }}>
          {routeBlocked ? (
            (permissionStatus === 'error' || permissionStatus === 'revoked') ? (
              /* مسار الفشل/الإبطال: لا نعرض أبدًا children — السلطة مفقودة، فالتركيب رفض افتراضي، لكن يبقى أمام المستخدم مخرج قابل للتعافي. */
              <div
                data-testid="permission-error"
                className="flex flex-col items-center justify-center h-64 text-center gap-3"
                role="alert"
              >
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  تعذّر تحميل صلاحياتك.
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {permissionError ?? 'لا يمكن تحميل الصلاحيات حاليًا. أعد المحاولة أو سجّل الخروج ثم الدخول من جديد.'}
                </p>
                <button
                  type="button"
                  onClick={retryPermissions}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : (
              /* الحالة الانتظارية: لا عظمٌ بلا نهاية. تُعرض الصفحة نفسها
                 (ترويسة + أدوات + محتوى) بدل spinner وسط فراغ، فالتنقل يبدو كاستمرارية بدل قفزة إلى فراغ. */
              <PageSkeleton variant={skeletonVariant} />
            )
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <DashboardInner>{children}</DashboardInner>
    </LanguageProvider>
  );
}
