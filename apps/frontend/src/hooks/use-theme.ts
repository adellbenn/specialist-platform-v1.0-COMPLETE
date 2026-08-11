'use client';

import { useTheme } from 'next-themes';
import { useCallback } from 'react';
import { themeService, ThemeMode } from '@/lib/theme.service';

export function useThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggle = useCallback(() => {
    const next: ThemeMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    themeService.updatePreference(next);
  }, [resolvedTheme, setTheme]);

  const setThemeWithPersist = useCallback(
    (t: ThemeMode) => {
      setTheme(t);
      themeService.updatePreference(t);
    },
    [setTheme],
  );

  return {
    theme: theme as ThemeMode | undefined,
    resolvedTheme: resolvedTheme as 'light' | 'dark' | undefined,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    toggle,
    setTheme: setThemeWithPersist,
  };
}
