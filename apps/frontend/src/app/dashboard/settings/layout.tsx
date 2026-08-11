'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  User, Shield, Globe, Paintbrush, Bell, Calendar, CreditCard, Puzzle, 
  Users, FileText, Database, ChevronLeft,
} from 'lucide-react';

const SETTINGS_ITEMS = [
  { href: '/dashboard/settings',             label: 'الملف الشخصي',     icon: User,       exact: true },
  { href: '/dashboard/settings/security',     label: 'الأمان',           icon: Shield      },
  { href: '/dashboard/settings/language',     label: 'اللغة والمنطقة',   icon: Globe       },
  { href: '/dashboard/settings/appearance',   label: 'المظهر',           icon: Paintbrush  },
  { href: '/dashboard/settings/notifications',label: 'الإشعارات',        icon: Bell        },
  { href: '/dashboard/settings/calendar',     label: 'التقويم',          icon: Calendar    },
  { href: '/dashboard/settings/billing',      label: 'الفواتير والاشتراك', icon: CreditCard },
  { href: '/dashboard/settings/integrations', label: 'التكاملات',        icon: Puzzle      },
  { href: '/dashboard/settings/team',         label: 'الفريق والصلاحيات', icon: Users       },
  { href: '/dashboard/settings/audit',        label: 'سجل التدقيق',      icon: FileText    },
  { href: '/dashboard/settings/data',         label: 'البيانات والنسخ الاحتياطي', icon: Database },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-6" style={{ minHeight: 'calc(100vh - 180px)' }}>
      {/* Sidebar */}
      <aside className="hidden lg:block w-56 shrink-0">
        <nav className="space-y-0.5 sticky top-20">
          {SETTINGS_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition group"
                style={{
                  backgroundColor: isActive ? 'var(--primary-50)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                }}>
                <Icon size={16} className={isActive ? '' : 'opacity-60 group-hover:opacity-100'} />
                <span className="font-medium">{item.label}</span>
                {isActive && <ChevronLeft size={14} className="mr-auto" style={{ color: 'var(--primary)' }} />}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile tabs */}
      <div className="lg:hidden w-full mb-4 overflow-x-auto">
        <div className="flex gap-1 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
          {SETTINGS_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition shrink-0"
                style={{
                  backgroundColor: isActive ? 'var(--primary)' : 'var(--surface)',
                  color: isActive ? '#fff' : 'var(--text-primary)',
                }}>
                <Icon size={14} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
