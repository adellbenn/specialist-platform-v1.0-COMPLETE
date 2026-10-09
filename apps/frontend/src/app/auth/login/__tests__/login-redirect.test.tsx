import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

/* `next/link` يتطلب سياق App Router، نستبدله بعنصر <a> بسيط داخل الاختبار. */
vi.mock('next/link', async () => {
  const React = await import('react');
  return {
    default: ({ children, href }: any) => React.createElement('a', { href }, children),
  };
});

const loginMock = vi.fn();
vi.mock('@/store/auth.store', () => ({
  useAuthStore: () => ({ login: loginMock, isLoading: false }),
}));

import LoginPage from '@/app/auth/login/page';

const fillAndSubmit = () => {
  fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'a@b.com' } });
  fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'secret1' } });
  fireEvent.click(screen.getByRole('button', { name: /تسجيل الدخول/ }));
};

beforeEach(() => {
  push.mockClear();
  loginMock.mockReset();
});

describe('login redirect حسب mustChangePassword', () => {
  it('العلم true → التحويل إلى /auth/change-password', async () => {
    loginMock.mockResolvedValueOnce(true);
    render(<LoginPage />);
    fillAndSubmit();

    await waitFor(() => expect(push).toHaveBeenCalledWith('/auth/change-password'));
  });

  it('العلم false → التحويل إلى /dashboard', async () => {
    loginMock.mockResolvedValueOnce(false);
    render(<LoginPage />);
    fillAndSubmit();

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'));
  });
});
