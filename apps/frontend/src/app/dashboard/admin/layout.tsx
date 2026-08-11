'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Users, Key, FolderOpen, Activity, AlertTriangle } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuthStore } from '@/store/auth.store';
import { PageLoader } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/dashboard/admin/roles',       label: 'الأدوار',       icon: Shield },
  { href: '/dashboard/admin/permissions',  label: 'الصلاحيات',     icon: Key },
  { href: '/dashboard/admin/users',        label: 'المستخدمون',    icon: Users },
  { href: '/dashboard/admin/groups',       label: 'المجموعات',     icon: FolderOpen },
  { href: '/dashboard/admin/security',     label: 'الأمان',        icon: AlertTriangle },
  { href: '/dashboard/admin/audit',        label: 'سجل التدقيق',   icon: Activity },
];

const ADMIN_ROLES = ['super_admin', 'center_manager', 'supervisor'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  const { isSuperAdmin } = usePermissions();

  useEffect(() => {
    if (!_hydrated) return;
    if (!user || !isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    if (ADMIN_ROLES.includes(user.role)) {
      return;
    }
    router.replace('/dashboard');
  }, [user, isAuthenticated, _hydrated, router]);

  if (!_hydrated || !user || !isAuthenticated) return <PageLoader />;
  if (!ADMIN_ROLES.includes(user.role)) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary shrink-0">
          <Shield size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-h2 font-semibold text-text-primary">مركز الإدارة</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            إدارة الأدوار والصلاحيات والمجموعات وإعدادات الأمان
          </p>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <button key={tab.href} onClick={() => router.push(tab.href)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap',
                isActive
                  ? 'text-white shadow-sm'
                  : 'hover:bg-[var(--surface)]',
              )}
              style={{
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {children}
    </div>
  );
}
