'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/auth.store';
import { themeService } from '@/lib/theme.service';

/**
 * Syncs the user's theme preference from the database
 * to next-themes on login / user change.
 */
export function ThemeSync() {
  const { user } = useAuthStore();
  const { setTheme, theme } = useTheme();

  const themeRef = useRef(theme);
  themeRef.current = theme;

  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (!user?.themePreference) return;
    if (user.themePreference !== themeRef.current) {
      setTheme(user.themePreference);
    }
  }, [user?.id, user?.themePreference, setTheme]);

  // When user logs in, save current theme to DB if not set
  useEffect(() => {
    const u = userRef.current;
    if (!u) return;
    if (u.themePreference) return;
    const t = themeRef.current;
    if (!t) return;
    themeService.updatePreference(t as 'light' | 'dark' | 'system');
  }, [user?.id]);

  return null;
}
