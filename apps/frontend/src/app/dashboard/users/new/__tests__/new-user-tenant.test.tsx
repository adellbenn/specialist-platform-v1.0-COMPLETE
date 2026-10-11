import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/components/auth/route-guard', () => ({
  useRouteGuard: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
  registerAuthFailureHandler: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import NewUserPage from '@/app/dashboard/users/new/page';

const mockedGet = vi.mocked(apiClient.get);
const mockedPost = vi.mocked(apiClient.post);

const setUser = (role: string, tenantId: string | null) =>
  useAuthStore.setState({
    user: {
      id: 'u1',
      email: 'a@b.c',
      firstName: 'A',
      lastName: 'B',
      role: role as any,
      tenantId,
      avatarUrl: null,
    },
    isAuthenticated: true,
    mustChangePassword: false,
    _hydrated: true,
  });

const realTenant = { id: 't1', name: 'مركز البرواقية', slug: 'center-1', isActive: true };
const testTenant = { id: 'zz', name: 'ZZ_TEST_TENANT', slug: 'zz-test-tenant', isActive: true };
const meta = { total: 2, page: 1, limit: 100, totalPages: 1 };

const fillRequired = (container: HTMLElement) => {
  const texts = container.querySelectorAll('input[type="text"]');
  fireEvent.change(texts[0], { target: { value: 'سالم' } });
  fireEvent.change(texts[1], { target: { value: 'محمد' } });
  fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'x@y.z' } });
  const pw = container.querySelectorAll('input[type="password"]');
  fireEvent.change(pw[0], { target: { value: 'password12' } });
  fireEvent.change(pw[1], { target: { value: 'password12' } });
};

const submit = () => fireEvent.click(screen.getByRole('button', { name: /إنشاء المستخدم/ }));

beforeEach(() => {
  mockedGet.mockReset();
  mockedPost.mockReset();
});

describe('نموذج مستخدم جديد — مُحدِّد المركز', () => {
  it('super_admin: يظهر المُحدِّد، يُختار المركز الحقيقي الوحيد مسبقًا، ويُرسَل tenantId', async () => {
    setUser('super_admin', null);
    mockedGet.mockResolvedValueOnce({ data: { data: [realTenant, testTenant], meta } } as any);
    mockedPost.mockResolvedValueOnce({ data: { data: {}, message: 'ok' } } as any);

    const { container } = render(<NewUserPage />);

    const tenantSelect = (await screen.findByLabelText(/^المركز/)) as HTMLSelectElement;
    await waitFor(() => expect(tenantSelect.value).toBe('t1'));

    fillRequired(container);
    submit();

    await waitFor(() => expect(mockedPost).toHaveBeenCalled());
    const body = mockedPost.mock.calls[0][1] as any;
    expect(mockedPost.mock.calls[0][0]).toBe('/users');
    expect(body.tenantId).toBe('t1');
  });

  it('مركز آخر (center_manager): لا يظهر المُحدِّد ولا يُرسَل tenantId', async () => {
    setUser('center_manager', 't-cm');
    mockedPost.mockResolvedValueOnce({ data: { data: {}, message: 'ok' } } as any);

    const { container } = render(<NewUserPage />);

    expect(screen.queryByLabelText(/^المركز/)).toBeNull();
    expect(mockedGet).not.toHaveBeenCalled();

    fillRequired(container);
    submit();

    await waitFor(() => expect(mockedPost).toHaveBeenCalled());
    const body = mockedPost.mock.calls[0][1] as any;
    expect(body).not.toHaveProperty('tenantId');
  });

  it('super_admin عند اختيار دور المدير العام: يُخفى المُحدِّد ولا يُرسَل tenantId', async () => {
    setUser('super_admin', null);
    mockedGet.mockResolvedValueOnce({ data: { data: [realTenant], meta } } as any);
    mockedPost.mockResolvedValueOnce({ data: { data: {}, message: 'ok' } } as any);

    const { container } = render(<NewUserPage />);
    await screen.findByLabelText(/^المركز/);

    fireEvent.change(screen.getByLabelText(/الدور/), { target: { value: 'super_admin' } });
    expect(screen.queryByLabelText(/^المركز/)).toBeNull();

    fillRequired(container);
    submit();

    await waitFor(() => expect(mockedPost).toHaveBeenCalled());
    const body = mockedPost.mock.calls[0][1] as any;
    expect(body).not.toHaveProperty('tenantId');
    expect(body.role).toBe('super_admin');
  });

  it('super_admin: يمنع الإرسال مع رسالة عربية عند غياب المركز (خيارات متعددة)', async () => {
    setUser('super_admin', null);
    mockedGet.mockResolvedValueOnce({
      data: { data: [realTenant, { id: 't2', name: 'مركز آخر', slug: 'center-2', isActive: true }], meta },
    } as any);

    const { container } = render(<NewUserPage />);
    await screen.findByLabelText(/^المركز/);

    fillRequired(container);
    submit();

    expect(mockedPost).not.toHaveBeenCalled();
  });
});
