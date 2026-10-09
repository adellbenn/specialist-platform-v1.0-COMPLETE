import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

vi.mock('@/lib/api-client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
  registerAuthFailureHandler: vi.fn(),
}));

import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const mockedPost = vi.mocked(apiClient.post);
const mockedGet = vi.mocked(apiClient.get);

const asUser = (mustChangePassword: boolean) =>
  ({
    id: 'u1',
    email: 'a@b.c',
    firstName: 'A',
    lastName: 'B',
    role: 'specialist',
    tenantId: null,
    avatarUrl: null,
    mustChangePassword,
  }) as any;

const authPayload = (mustChangePassword: boolean) => ({
  data: { data: { accessToken: 'a', refreshToken: 'r', user: asUser(mustChangePassword) } },
});

beforeEach(() => {
  mockedPost.mockReset();
  mockedGet.mockReset();
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    mustChangePassword: false,
    _hydrated: true,
  });
});

describe('auth store: mustChangePassword', () => {
  it('login يعيد true ويحفظ العلم عندما يكون التغيير إلزاميًا', async () => {
    mockedPost.mockResolvedValueOnce(authPayload(true) as any);
    let returned: boolean | undefined;
    await act(async () => {
      returned = await useAuthStore.getState().login('a@b.c', 'pw');
    });
    expect(returned).toBe(true);
    expect(useAuthStore.getState().mustChangePassword).toBe(true);
  });

  it('login يعيد false عندما لا يكون التغيير إلزاميًا', async () => {
    mockedPost.mockResolvedValueOnce(authPayload(false) as any);
    let returned: boolean | undefined;
    await act(async () => {
      returned = await useAuthStore.getState().login('a@b.c', 'pw');
    });
    expect(returned).toBe(false);
    expect(useAuthStore.getState().mustChangePassword).toBe(false);
  });

  it('refreshUser يقرأ العلم من GET /auth/me', async () => {
    useAuthStore.setState({ user: asUser(false), isAuthenticated: true, mustChangePassword: false });
    mockedGet.mockResolvedValueOnce({ data: { data: asUser(true) } } as any);

    await act(async () => {
      await useAuthStore.getState().refreshUser();
    });

    expect(useAuthStore.getState().mustChangePassword).toBe(true);
  });

  it('clearMustChangePassword يمسح العلم من الحالة ومن المستخدم', () => {
    useAuthStore.setState({ user: asUser(true), isAuthenticated: true, mustChangePassword: true });

    act(() => {
      useAuthStore.getState().clearMustChangePassword();
    });

    expect(useAuthStore.getState().mustChangePassword).toBe(false);
    expect(useAuthStore.getState().user?.mustChangePassword).toBe(false);
  });
});
