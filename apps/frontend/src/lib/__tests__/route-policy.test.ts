import { describe, it, expect } from 'vitest';
import { getRoutePolicy } from '@/lib/route-policy';

describe('getRoutePolicy', () => {
  it('يطابق المسارات المحمية بدقة', () => {
    expect(getRoutePolicy('/dashboard/users')).toEqual({
      anyRole: ['super_admin', 'center_manager'],
      redirectTo: '/dashboard',
    });
    expect(getRoutePolicy('/dashboard/audit')?.anyRole).toEqual(['super_admin', 'center_manager']);
  });

  it('يطابق المسارات ذات المعرّف الديناميكي', () => {
    expect(getRoutePolicy('/dashboard/admin/roles/abc-123')).toEqual({
      anyRole: ['super_admin', 'center_manager'],
      redirectTo: '/dashboard',
    });
    expect(getRoutePolicy('/dashboard/beneficiaries/b-1/edit')?.permission).toBe('beneficiary:update');
    expect(getRoutePolicy('/dashboard/payments/invoices/i-9')?.anyRole).toContain('accountant');
  });

  it('يفضّل النمط الدقيق على النمط العام (sessions/new ليست sessions/:id)', () => {
    expect(getRoutePolicy('/dashboard/sessions/new')?.permission).toBe('session:create');
    expect(getRoutePolicy('/dashboard/sessions/xyz-1')?.anyRole).toEqual([
      'super_admin',
      'center_manager',
      'supervisor',
      'specialist',
    ]);
  });

  it('لا يطابق المسارات الفرعية غير المحمية', () => {
    expect(getRoutePolicy('/dashboard/admin/roles')).not.toBeNull();
    expect(getRoutePolicy('/dashboard/admin/roles/deeper/still')).toBeNull();
  });

  it('يغطّي المسارات التي كانت مفتوحة لأي مستخدم (fail-open)', () => {
    /* هذه المسارات كانت بلا سياسة إطلاقًا. الآن لكل منها سياسة صريحة. */
    expect(getRoutePolicy('/dashboard')?.anyRole).toContain('accountant');
    expect(getRoutePolicy('/dashboard/beneficiaries')?.anyRole).toBeTruthy();
    expect(getRoutePolicy('/dashboard/beneficiaries/b-1')?.anyRole).toBeTruthy();
    expect(getRoutePolicy('/dashboard/appointments')?.anyRole).toBeTruthy();
    expect(getRoutePolicy('/dashboard/appointments/a-1')?.anyRole).toBeTruthy();
    expect(getRoutePolicy('/dashboard/reports')?.anyRole).toBeTruthy();
    expect(getRoutePolicy('/dashboard/reports/r-1')?.anyRole).toBeTruthy();
    expect(getRoutePolicy('/dashboard/notifications')?.anyRole).toBeTruthy();
    expect(getRoutePolicy('/dashboard/search')?.anyRole).toBeTruthy();
  });

  it('يفصل تفضيلات شخصية عن إعدادات إدارة داخل /settings', () => {
    for (const p of ['appearance', 'language', 'notifications', 'calendar']) {
      expect(getRoutePolicy(`/dashboard/settings/${p}`)?.anyRole, p).toContain('specialist');
    }
    for (const p of ['team', 'security', 'audit', 'data', 'billing', 'integrations']) {
      const roles = getRoutePolicy(`/dashboard/settings/${p}`)?.anyRole;
      expect(roles, p).toEqual(['super_admin', 'center_manager']);
    }
  });

  it('يمنع المحاسب من الوصول لمسارات المالية لصلاحياته', () => {
    const payments = getRoutePolicy('/dashboard/payments');
    expect(payments?.anyRole).toContain('accountant');
    /* الأدوار الإدارية لا تملك مسارًا بلا تصريح */
    expect(getRoutePolicy('/dashboard/admin/users')?.anyRole).not.toContain('accountant');
    expect(getRoutePolicy('/dashboard/admin/audit')?.anyRole).not.toContain('accountant');
  });

  it('يمنح المستفيد لوحة المنصة — بلا حلقة تحويل عند الجذر', () => {
    const dash = getRoutePolicy('/dashboard');
    expect(dash?.anyRole).toContain('beneficiary');
  });

  it('يمنع المستفيد من /users و /settings دون تحويل إلى /auth/login', () => {
    for (const r of ['/dashboard/users', '/dashboard/settings']) {
      const p = getRoutePolicy(r);
      expect(p?.anyRole, r).not.toContain('beneficiary');
      expect(p?.redirectTo, r).toBe('/dashboard');
      expect(p?.redirectTo, r).not.toBe('/auth/login');
    }
  });

  it('يمنح المستفيد مسارات بياناته فقط ويحرم الإدارة والمالية', () => {
    for (const r of ['/dashboard/appointments', '/dashboard/appointments/a-1', '/dashboard/notifications', '/dashboard/profile']) {
      expect(getRoutePolicy(r)?.anyRole, r).toContain('beneficiary');
    }
    for (const r of [
      '/dashboard/users',
      '/dashboard/specialists',
      '/dashboard/beneficiaries',
      '/dashboard/sessions',
      '/dashboard/reports',
      '/dashboard/files',
      '/dashboard/payments',
      '/dashboard/settings',
      '/dashboard/admin/users',
      '/dashboard/audit',
      '/dashboard/analytics',
      '/dashboard/search',
    ]) {
      expect(getRoutePolicy(r)?.anyRole, r).not.toContain('beneficiary');
    }
  });
});
