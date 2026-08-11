import apiClient from '@/lib/api-client';
import { AppearancePreferences } from '@/store/theme-customizer.store';

export const preferencesService = {
  get: () =>
    apiClient.get<{ data: Partial<AppearancePreferences> }>('/users/preferences/me'),

  update: (preferences: Partial<AppearancePreferences>) =>
    apiClient.put<{ data: Partial<AppearancePreferences>; message: string }>('/users/preferences/me', { preferences }),
};
