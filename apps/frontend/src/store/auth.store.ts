import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { User, AuthTokens } from '@/types';
import apiClient from '@/lib/api-client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hydrated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      _hydrated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.post<{ data: AuthTokens }>('/auth/login', {
            email,
            password,
          });

          const { accessToken, refreshToken, user } = data.data;

          // حفظ التوكنات في Cookies
          const secure = process.env.NODE_ENV === 'production';
          Cookies.set('accessToken', accessToken, { expires: 1, sameSite: 'lax', secure, path: '/' });
          Cookies.set('refreshToken', refreshToken, { expires: 7, sameSite: 'lax', secure, path: '/' });

          set({ user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        Cookies.remove('accessToken', { path: '/' });
        Cookies.remove('refreshToken', { path: '/' });
        set({ user: null, isAuthenticated: false });
        apiClient.post('/auth/logout').catch(() => {});
      },

      refreshUser: async () => {
        try {
          const { data } = await apiClient.get<{ data: User }>('/auth/me');
          set({ user: data.data, isAuthenticated: true });
        } catch {
          get().logout();
        }
      },

      setUser: (user: User) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ _hydrated: true });
      },
    },
  ),
);
