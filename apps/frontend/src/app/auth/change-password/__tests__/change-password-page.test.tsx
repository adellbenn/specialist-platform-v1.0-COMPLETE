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

vi.mock('@/lib/api-client', () => ({
  default: { patch: vi.fn(), get: vi.fn(), post: vi.fn() },
  registerAuthFailureHandler: vi.fn(),
}));

import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import ChangePasswordPage from '@/app/auth/change-password/page';

const mockedPatch = vi.mocked(apiClient.patch);

beforeEach(() => {
  push.mockClear();
  mockedPatch.mockReset();
  useAuthStore.setState({
    user: {
      id: 'u1',
      email: 'a@b.c',
      firstName: 'A',
      lastName: 'B',
      role: 'specialist',
      tenantId: null,
      avatarUrl: null,
      mustChangePassword: true,
    },
    isAuthenticated: true,
    mustChangePassword: true,
    _hydrated: true,
  });
});

const fill = (current: string, next: string, confirm: string) => {
  fireEvent.change(screen.getByLabelText('كلمة المرور الحالية'), { target: { value: current } });
  fireEvent.change(screen.getByLabelText('كلمة المرور الجديدة'), { target: { value: next } });
  fireEvent.change(screen.getByLabelText('تأكيد كلمة المرور الجديدة'), { target: { value: confirm } });
};

const submit = () =>
  fireEvent.click(screen.getByRole('button', { name: /حفظ كلمة المرور الجديدة/ }));

describe('صفحة تغيير كلمة المرور الإلزامي', () => {
  it('عند النجاح يمسح العلم ويحوّل إلى /dashboard', async () => {
    mockedPatch.mockResolvedValueOnce({ data: {} } as any);

    render(<ChangePasswordPage />);
    fill('oldpass1', 'newpass12', 'newpass12');
    submit();

    await waitFor(() =>
      expect(mockedPatch).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'oldpass1',
        newPassword: 'newpass12',
      }),
    );
    await waitFor(() => expect(useAuthStore.getState().mustChangePassword).toBe(false));
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('عند عدم تطابق التأكيد يظهر خطأ ولا يُنادى الـ API', async () => {
    render(<ChangePasswordPage />);
    fill('oldpass1', 'newpass12', 'different12');
    submit();

    expect(await screen.findByText('كلمتا المرور غير متطابقتين')).toBeInTheDocument();
    expect(useAuthStore.getState().mustChangePassword).toBe(true);
    expect(mockedPatch).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
