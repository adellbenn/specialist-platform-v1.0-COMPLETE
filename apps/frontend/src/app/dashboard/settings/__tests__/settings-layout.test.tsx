import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/settings',
}));

import SettingsLayout from '@/app/dashboard/settings/layout';

const PLACEHOLDER_HREFS = [
  '/dashboard/settings/security',
  '/dashboard/settings/language',
  '/dashboard/settings/notifications',
  '/dashboard/settings/calendar',
  '/dashboard/settings/billing',
  '/dashboard/settings/integrations',
  '/dashboard/settings/team',
  '/dashboard/settings/audit',
  '/dashboard/settings/data',
];

describe('settings layout: إخفاء روابط الصفحات الفارغة', () => {
  it('لا يعرض أي رابط لأي من صفحات "قريباً" التسع', () => {
    const { container } = render(
      <SettingsLayout>
        <div data-testid="child" />
      </SettingsLayout>,
    );

    for (const href of PLACEHOLDER_HREFS) {
      expect(container.querySelector(`a[href="${href}"]`)).toBeNull();
    }
  });

  it('يبقي روابط الإعدادات العاملة (الملف الشخصي والمظهر)', () => {
    const { container } = render(
      <SettingsLayout>
        <div data-testid="child" />
      </SettingsLayout>,
    );

    expect(container.querySelector('a[href="/dashboard/settings"]')).not.toBeNull();
    expect(container.querySelector('a[href="/dashboard/settings/appearance"]')).not.toBeNull();
  });
});
