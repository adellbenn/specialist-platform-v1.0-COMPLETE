import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const perms = vi.hoisted(() => ({ list: [] as string[] }));

const authState: any = {
  user: { id: 'u1', firstName: 'سالم', lastName: 'م', role: 'specialist', tenant: { name: 'مركز' } },
};
vi.mock('@/store/auth.store', () => ({ useAuthStore: () => authState }));

vi.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => ({ can: (p: string) => perms.list.includes(p) }),
}));

const stats = {
  beneficiaries: { total: 10, active: 8, newThisMonth: 2, newThisWeek: 1 },
  sessions: { total: 20, thisMonth: 5, present: 18, absent: 2, attendanceRate: 90 },
  appointments: { today: 3, upcoming: 4, pendingReports: 0 },
  subscriptions: { active: 2, expiringSoon: 0 },
  financial: { totalRevenue: 100000, monthRevenue: 25000 },
  team: { specialists: 3 },
};

vi.mock('@/hooks/queries/use-dashboard', () => ({
  useDashboardStats: () => ({ stats, isLoading: false }),
  useTodayAppointments: () => ({ appointments: [], isLoading: false }),
}));

import DashboardPageClient from '@/app/dashboard/page-client';

beforeEach(() => {
  perms.list = [];
});

describe('لوحة التحكم: الروابط السريعة حسب الدور/الصلاحية', () => {
  it('تُعرض كل الروابط السريعة عند امتلاك كل الصلاحيات', () => {
    perms.list = ['appointment:create', 'beneficiary:create', 'session:create', 'payment:create', 'payment:view'];
    render(<DashboardPageClient />);

    expect(screen.getByText('موعد جديد')).toBeInTheDocument();
    expect(screen.getByText('مستفيد جديد')).toBeInTheDocument();
    expect(screen.getByText('جلسة جديدة')).toBeInTheDocument();
    expect(screen.getByText('فاتورة جديدة')).toBeInTheDocument();
  });

  it('تُظهر الرابط المسموح وحده عند افتقار الصلاحيات', () => {
    perms.list = ['appointment:create'];
    render(<DashboardPageClient />);

    expect(screen.getByText('موعد جديد')).toBeInTheDocument();
    expect(screen.queryByText('مستفيد جديد')).toBeNull();
    expect(screen.queryByText('جلسة جديدة')).toBeNull();
    expect(screen.queryByText('فاتورة جديدة')).toBeNull();
  });

  it('لا تُعرض أي روابط سريعة عند غياب الصلاحيات', () => {
    perms.list = [];
    render(<DashboardPageClient />);

    expect(screen.queryByText('روابط سريعة')).toBeNull();
    expect(screen.queryByText('موعد جديد')).toBeNull();
  });
});
