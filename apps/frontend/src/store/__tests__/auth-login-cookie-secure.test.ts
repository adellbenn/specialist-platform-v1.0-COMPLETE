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

vi.mock('js-cookie', () => ({
  default: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
}));

import apiClient from '@/lib/api-client';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/auth.store';

const mockedPost = vi.mocked(apiClient.post);
const mockedCookies = Cookies as unknown as { set: ReturnType<typeof vi.fn> };

const authPayload = () => ({
  data: {
    data: {
      accessToken: 'access',
      refreshToken: 'refresh',
      user: {
        id: 'u1',
        email: 'a@b.c',
        firstName: 'A',
        lastName: 'B',
        role: 'specialist',
        tenantId: null,
        avatarUrl: null,
        mustChangePassword: false,
      },
    },
  },
});

let protocol: string;

beforeEach(() => {
  mockedPost.mockReset();
  mockedCookies.set.mockReset();
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    mustChangePassword: false,
    _hydrated: true,
  });
  protocol = 'http:';
  Object.defineProperty(window, 'location', {
    value: { get protocol() { return protocol; } },
    writable: true,
    configurable: true,
  });
});

describe('auth store: خيارات كوكيز الدخول (http مقابل https)', () => {
  it('على http يضبط secure=false مع بقية الخيارات', async () => {
    protocol = 'http:';
    mockedPost.mockResolvedValueOnce(authPayload() as any);

    await act(async () => {
      await useAuthStore.getState().login('a@b.c', 'pw');
    });

    expect(mockedCookies.set).toHaveBeenCalledWith('accessToken', 'access', {
      expires: 1, sameSite: 'lax', secure: false, path: '/',
    });
    expect(mockedCookies.set).toHaveBeenCalledWith('refreshToken', 'refresh', {
      expires: 7, sameSite: 'lax', secure: false, path: '/',
    });
  });

  it('على https يضبط secure=true مع بقية الخيارات', async () => {
    protocol = 'https:';
    mockedPost.mockResolvedValueOnce(authPayload() as any);

    await act(async () => {
      await useAuthStore.getState().login('a@b.c', 'pw');
    });

    expect(mockedCookies.set).toHaveBeenCalledWith('accessToken', 'access', {
      expires: 1, sameSite: 'lax', secure: true, path: '/',
    });
    expect(mockedCookies.set).toHaveBeenCalledWith('refreshToken', 'refresh', {
      expires: 7, sameSite: 'lax', secure: true, path: '/',
    });
  });
});
