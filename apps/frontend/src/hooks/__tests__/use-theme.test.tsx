import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}));

vi.mock('@/lib/theme.service', () => ({
  themeService: { updatePreference: vi.fn() },
}));

import { useTheme } from 'next-themes';
import { themeService } from '@/lib/theme.service';
import { useThemeToggle } from '@/hooks/use-theme';

const mockedTheme = vi.mocked(useTheme);
const setTheme = vi.fn();

const setResolved = (resolvedTheme?: 'light' | 'dark') => {
  mockedTheme.mockReturnValue({
    theme: resolvedTheme,
    setTheme,
    resolvedTheme,
  } as any);
};

beforeEach(() => {
  setTheme.mockReset();
  vi.mocked(themeService.updatePreference).mockReset();
  setResolved('light');
});

describe('useThemeToggle — الاشتقاقات', () => {
  it('resolvedTheme=light ⇒ isLight وisDark=false', () => {
    const { result } = renderHook(() => useThemeToggle());
    expect(result.current.isLight).toBe(true);
    expect(result.current.isDark).toBe(false);
  });

  it('resolvedTheme=dark ⇒ isDark وisLight=false', () => {
    setResolved('dark');
    const { result } = renderHook(() => useThemeToggle());
    expect(result.current.isDark).toBe(true);
    expect(result.current.isLight).toBe(false);
  });

  it('resolvedTheme=undefined ⇒ كلاهما false — لا حالة مزدوجة', () => {
    setResolved(undefined);
    const { result } = renderHook(() => useThemeToggle());
    expect(result.current.isDark).toBe(false);
    expect(result.current.isLight).toBe(false);
    expect(result.current.resolvedTheme).toBeUndefined();
  });

  it('theme يُمرَّر كما هو من next-themes', () => {
    setResolved('dark');
    const { result } = renderHook(() => useThemeToggle());
    expect(result.current.theme).toBe('dark');
  });
});

describe('useThemeToggle — toggle', () => {
  it('من light ينتقل إلى dark ويحفظ التفضيل', () => {
    const { result } = renderHook(() => useThemeToggle());
    act(() => result.current.toggle());
    expect(setTheme).toHaveBeenCalledWith('dark');
    expect(vi.mocked(themeService.updatePreference)).toHaveBeenCalledWith('dark');
  });

  it('من dark ينتقل إلى light', () => {
    setResolved('dark');
    const { result } = renderHook(() => useThemeToggle());
    act(() => result.current.toggle());
    expect(setTheme).toHaveBeenCalledWith('light');
  });

  it('undefined (قبل الـ hydration) ⇒ dark — لا يومض إلى light ثم يرتد', () => {
    /* resolvedTheme غير معروف بعد: الافتراضي dark يطابق
       useTheme() في next-themes ولا يقلب الوضع مرتين. */
    setResolved(undefined);
    const { result } = renderHook(() => useThemeToggle());
    act(() => result.current.toggle());
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('theme=system يُحفظ как light/dark لا كـsystem', () => {
    /* resolvedTheme يحسم 'system' إلى قيمة ملموسة قبل التبديل. */
    mockedTheme.mockReturnValue({ theme: 'system', setTheme, resolvedTheme: 'light' } as any);
    const { result } = renderHook(() => useThemeToggle());
    act(() => result.current.toggle());
    expect(setTheme).toHaveBeenCalledWith('dark');
    expect(setTheme).not.toHaveBeenCalledWith('system');
  });

  it('toggle مرتين يعود للوضع الأصلي — بعد إعادة رسم بتحديث resolvedTheme', () => {
    setResolved('light');
    const { result, rerender } = renderHook(() => useThemeToggle());
    act(() => result.current.toggle());
    /* next-themes يحدّث resolvedTheme بعد setTheme — بلا rerender
       يبقى useCallback على القيمة القديمة ولا تتبدّل النتيجة. */
    setResolved('dark');
    rerender();
    act(() => result.current.toggle());
    expect(vi.mocked(themeService.updatePreference).mock.calls.map((c) => c[0]))
      .toEqual(['dark', 'light']);
  });
});

describe('useThemeToggle — setThemeWithPersist', () => {
  it('يحفظ الاختيار الصريح ويشغّل persistence', () => {
    const { result } = renderHook(() => useThemeToggle());
    act(() => result.current.setTheme('dark'));
    expect(setTheme).toHaveBeenCalledWith('dark');
    expect(vi.mocked(themeService.updatePreference)).toHaveBeenCalledWith('dark');
  });

  it('يقبل system ويمرّره كما هو', () => {
    const { result } = renderHook(() => useThemeToggle());
    act(() => result.current.setTheme('system'));
    expect(setTheme).toHaveBeenCalledWith('system');
    expect(vi.mocked(themeService.updatePreference)).toHaveBeenCalledWith('system');
  });
});

/* اختبارات themeService نفسها في src/lib/__tests__/theme.service.test.ts —
   هنا `theme.service` مُحاكى، فالاختبار الحقيقي يحتاج وحدة مستقلة. */