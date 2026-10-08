import { describe, it, expect, vi, beforeEach } from 'vitest';
import { middleware } from '@/middleware';

const redirectMock = vi.fn();
const nextMock = vi.fn();

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: (...args: unknown[]) => {
      redirectMock(...args);
      return { type: 'redirect' } as never;
    },
    next: (...args: unknown[]) => {
      nextMock(...args);
      return { type: 'next' } as never;
    },
  },
}));

function makeRequest(pathname: string, token?: string) {
  const searchParams = { set: vi.fn() };
  return {
    nextUrl: {
      pathname,
      clone: () => ({ pathname, searchParams }),
    },
    cookies: {
      get: () => (token ? { value: token } : undefined),
    },
  } as never;
}

const redirectedTo = () => (redirectMock.mock.calls[0]?.[0] as { pathname: string })?.pathname;

beforeEach(() => {
  redirectMock.mockReset();
  nextMock.mockReset();
});

describe('middleware: redirect authenticated users away from /auth/*', () => {
  it('with token, /auth/login redirects to /dashboard', () => {
    middleware(makeRequest('/auth/login', 'token'));

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectedTo()).toBe('/dashboard');
    expect(nextMock).not.toHaveBeenCalled();
  });

  it('with token, /auth/forgot-password redirects to /dashboard', () => {
    middleware(makeRequest('/auth/forgot-password', 'token'));

    expect(redirectedTo()).toBe('/dashboard');
  });

  it('without token, /auth/login is served normally', () => {
    middleware(makeRequest('/auth/login'));

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('without token, /auth/reset-password is served normally', () => {
    middleware(makeRequest('/auth/reset-password'));

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('protected /dashboard without token redirects to /auth/login with returnUrl', () => {
    middleware(makeRequest('/dashboard'));

    expect(redirectMock).toHaveBeenCalledTimes(1);
    const args = redirectMock.mock.calls[0][0] as { pathname: string; searchParams: { set: ReturnType<typeof vi.fn> } };
    expect(args.pathname).toBe('/auth/login');
    expect(args.searchParams.set).toHaveBeenCalledWith('returnUrl', '/dashboard');
  });

  it('protected /dashboard with token is served normally', () => {
    middleware(makeRequest('/dashboard', 'token'));

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('with token, / redirects to /dashboard', () => {
    middleware(makeRequest('/', 'token'));

    expect(redirectedTo()).toBe('/dashboard');
  });

  it('without token, / is served normally', () => {
    middleware(makeRequest('/'));

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});