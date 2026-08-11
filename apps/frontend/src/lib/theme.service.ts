import apiClient from './api-client';

export type ThemeMode = 'light' | 'dark' | 'system';

export const themeService = {
  async updatePreference(theme: ThemeMode): Promise<void> {
    try {
      await apiClient.patch('/auth/theme', { theme });
    } catch {
      // Silent fail — theme preference is cached in localStorage
    }
  },
};
