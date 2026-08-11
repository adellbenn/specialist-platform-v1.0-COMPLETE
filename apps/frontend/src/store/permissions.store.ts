import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api-client';

interface PermissionsState {
  permissions: string[];
  loaded: boolean;
  loading: boolean;

  fetchPermissions: () => Promise<void>;
  clearPermissions: () => void;
  has: (permission: string) => boolean;
  hasAny: (...permissions: string[]) => boolean;
  hasAll: (...permissions: string[]) => boolean;
  setPermissions: (perms: string[]) => void;
}

export const usePermissionsStore = create<PermissionsState>()(
  persist(
    (set, get) => ({
      permissions: [],
      loaded: false,
      loading: false,

      fetchPermissions: async () => {
        set({ loading: true });
        try {
          const { data } = await apiClient.get<{ data: string[] }>('/permissions/users/me');
          set({ permissions: data.data, loaded: true });
        } catch {
          set({ loaded: true });
        } finally {
          set({ loading: false });
        }
      },

      clearPermissions: () => {
        set({ permissions: [], loaded: false });
      },

      has: (permission: string) => {
        return get().permissions.includes(permission);
      },

      hasAny: (...permissions: string[]) => {
        const current = get().permissions;
        return permissions.some((p) => current.includes(p));
      },

      hasAll: (...permissions: string[]) => {
        const current = get().permissions;
        return permissions.every((p) => current.includes(p));
      },

      setPermissions: (perms: string[]) => {
        set({ permissions: perms, loaded: true });
      },
    }),
    {
      name: 'permissions-storage',
      partialize: (state) => ({ permissions: state.permissions, loaded: state.loaded }),
    },
  ),
);
