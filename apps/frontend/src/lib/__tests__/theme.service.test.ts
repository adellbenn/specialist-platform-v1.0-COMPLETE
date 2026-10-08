import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '@/lib/api-client';
import { themeService } from '@/lib/theme.service';

vi.mock('@/lib/api-client', () => ({
  default: { patch: vi.fn(), get: vi.fn() },
  registerAuthFailureHandler: vi.fn(),
}));

const mockedPatch = vi.mocked(apiClient.patch);

beforeEach(() => {
  mockedPatch.mockReset();
});

describe('themeService.updatePreference', () => {
  it('PATCH /auth/theme بالحمولة الصحيحة', async () => {
    mockedPatch.mockResolvedValue({ data: {} } as any);
    await themeService.updatePreference('dark');
    expect(mockedPatch).toHaveBeenCalledWith('/auth/theme', { theme: 'dark' });
  });

  it('يقبل light وsystem كما هي', async () => {
    mockedPatch.mockResolvedValue({ data: {} } as any);
    await themeService.updatePreference('light');
    await themeService.updatePreference('system');
    expect(mockedPatch.mock.calls.map((c) => (c[1] as { theme: string }).theme))
      .toEqual(['light', 'system']);
  });

  it('يبتلع الفشل بصمت — المظهر محفوظ في localStorage، الخطأ لا يُصحّحه', async () => {
    mockedPatch.mockRejectedValue(new Error('offline'));
    await expect(themeService.updatePreference('dark')).resolves.toBeUndefined();
  });

  it('يبتلع خطأ 401/403 أيضاً — لا يحوّل رفض التفويض إلى انهيار واجهة', async () => {
    mockedPatch.mockRejectedValue(
      Object.assign(new Error('unauthorized'), { response: { status: 401 } }),
    );
    await expect(themeService.updatePreference('dark')).resolves.toBeUndefined();
  });

  it('لا يرمي حتى لو كان الرد ليس 2xx بلا رفض', async () => {
    mockedPatch.mockResolvedValue({ status: 500, data: {} } as any);
    await expect(themeService.updatePreference('light')).resolves.toBeUndefined();
  });
});