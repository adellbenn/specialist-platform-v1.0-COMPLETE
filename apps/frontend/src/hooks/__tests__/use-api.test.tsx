import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/lib/api-client', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    patch:  vi.fn(),
    delete: vi.fn(),
  },
  registerAuthFailureHandler: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import apiClient from '@/lib/api-client';
import { useFetch, useMutate } from '@/hooks/use-api';
import toast from 'react-hot-toast';

const mocked = {
  get:    vi.mocked(apiClient.get),
  post:   vi.mocked(apiClient.post),
  put:    vi.mocked(apiClient.put),
  patch:  vi.mocked(apiClient.patch),
  delete: vi.mocked(apiClient.delete),
};

/**
 * **يجب** استدعاؤها داخل كل `it` لا مرة على مستوى الملف.
 *
 * عميل واحد مشترك بين الاختبارات يعني أن `queryKey` واحداً يُعاد استخدامه،
 * فيرث الاختبار الثاني نتيجة الأول المخزّنة: الطلب لا يُطلق أصلاً أو الحالة
 * السابقة (`isError`) تتسرّب. صُدِّم هذا فعلاً أثناء التطوير — اختبارات
 * `useFetch` كانت تنجح منفردة وتفشل في التشغيل الكامل. `retry: false` مقصود
 * أيضاً، بدونه يعيد React Query الطلب ثلاث مرات ويجعل عدّ النداءات غير حتمي.
 */
function freshWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function IsolatedWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return IsolatedWrapper;
}

const apiEnvelope = <T,>(data: T) => ({ data: { success: true, data } });

beforeEach(() => {
  Object.values(mocked).forEach((m) => m.mockReset());
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

describe('useFetch', () => {
  it('يجلب من الـ url ويكشف data وisSuccess', async () => {
    mocked.get.mockResolvedValue(apiEnvelope([{ id: 1 }]) as any);

    const { result } = renderHook(() => useFetch<{ id: number }[]>(['x'], '/api/x'), { wrapper: freshWrapper() });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mocked.get).toHaveBeenCalledWith('/api/x');
    expect(result.current.data?.data).toEqual([{ id: 1 }]);
  });

  it('لا يطلق الطلب عند enabled=false — أساس عدم تسريب بيانات صفحة محظورة', async () => {
    const { result } = renderHook(
      () => useFetch(['x'], '/api/x', { enabled: false }),
      { wrapper: freshWrapper() },
    );

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(mocked.get).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it('isPending ينتهي وisError يرتفع عند فشل الشبكة', async () => {
    mocked.get.mockRejectedValue(Object.assign(new Error('boom'), {
      response: { data: { message: 'تعذر الاتصال' } },
    }));

    const { result } = renderHook(() => useFetch(['x'], '/api/x'), { wrapper: freshWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isPending).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('لا ينجح الجلب أبداً بعد error — لا حالة hybrid', async () => {
    mocked.get.mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useFetch(['x'], '/api/x'), { wrapper: freshWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(false);
  });

  it('enabled=true يُطلق الطلب (الافتراضي)', async () => {
    mocked.get.mockResolvedValue(apiEnvelope('v') as any);
    renderHook(() => useFetch(['x'], '/api/x'), { wrapper: freshWrapper() });
    await waitFor(() => expect(mocked.get).toHaveBeenCalledTimes(1));
  });

it('staleTime الافتراضي 5 دقائق يصل إلى ذاكرة الاستعلام', async () => {
    mocked.get.mockResolvedValue(apiEnvelope(null) as any);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    function W({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    }
    renderHook(() => useFetch(['stale'], '/api/x'), { wrapper: W });
    await waitFor(() => expect(mocked.get).toHaveBeenCalledTimes(1));
    const entry = qc.getQueryCache().find({ queryKey: ['stale'] });
    expect((entry?.options as { staleTime?: number } | undefined)?.staleTime).toBe(300_000);
  });

  it('staleTime المخصّص يتجاوز الافتراضي', async () => {
    mocked.get.mockResolvedValue(apiEnvelope(null) as any);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    function W({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    }
    renderHook(() => useFetch(['stale2'], '/api/x', { staleTime: 1000 }), { wrapper: W });
    await waitFor(() => expect(mocked.get).toHaveBeenCalledTimes(1));
    const entry = qc.getQueryCache().find({ queryKey: ['stale2'] });
    expect((entry?.options as { staleTime?: number } | undefined)?.staleTime).toBe(1000);
  });

  it('خطأ مخصص في queryKey لا يختلط مع خطأ آخر', async () => {
    mocked.get
      .mockRejectedValueOnce(new Error('A'))
      .mockResolvedValueOnce(apiEnvelope('B') as any);

    const a = renderHook(() => useFetch(['a'], '/api/a'), { wrapper: freshWrapper() });
    const b = renderHook(() => useFetch(['b'], '/api/b'), { wrapper: freshWrapper() });

    await waitFor(() => expect(a.result.current.isError).toBe(true));
    await waitFor(() => expect(b.result.current.isSuccess).toBe(true));
    expect(a.result.current.data).toBeUndefined();
    expect(b.result.current.data?.data).toBe('B');
  });
});

describe('useMutate', () => {
  it('post يمرّر المتغيّرات ويستخرج data', async () => {
    mocked.post.mockResolvedValue(apiEnvelope({ id: 7 }) as any);
    const { result } = renderHook(() => useMutate<{ id: number }, { name: string }>('/api/create'), { wrapper: freshWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ name: 'x' });
    });
    expect(mocked.post).toHaveBeenCalledWith('/api/create', { name: 'x' });
  });

  it('patch يستخدم دالة patch لا post', async () => {
    mocked.patch.mockResolvedValue(apiEnvelope(null) as any);
    const { result } = renderHook(() => useMutate<null, { id: number }>('/api/u', 'patch'), { wrapper: freshWrapper() });

    await act(async () => { await result.current.mutateAsync({ id: 1 }); });
    expect(mocked.patch).toHaveBeenCalledWith('/api/u', { id: 1 });
    expect(mocked.post).not.toHaveBeenCalled();
  });

  it('put يستخدم دالة put', async () => {
    mocked.put.mockResolvedValue(apiEnvelope(null) as any);
    const { result } = renderHook(() => useMutate<null, { id: number }>('/api/u', 'put'), { wrapper: freshWrapper() });

    await act(async () => { await result.current.mutateAsync({ id: 1 }); });
    expect(mocked.put).toHaveBeenCalledWith('/api/u', { id: 1 });
  });

  it('delete لا يرسل body — مسار مختلف في السطر 42', async () => {
    mocked.delete.mockResolvedValue(apiEnvelope(null) as any);
    const { result } = renderHook(() => useMutate<null, { id: number }>('/api/d', 'delete'), { wrapper: freshWrapper() });

    await act(async () => { await result.current.mutateAsync({ id: 3 }); });
    expect(mocked.delete).toHaveBeenCalledWith('/api/d');
    expect(mocked.delete).not.toHaveBeenCalledWith('/api/d', { id: 3 });
  });

  it('يعرض toast رسالة نجاح عند successMessage', async () => {
    mocked.post.mockResolvedValue(apiEnvelope(null) as any);
    const { result } = renderHook(
      () => useMutate<null, void>('/api/c', 'post', { successMessage: 'تم الحفظ' }),
      { wrapper: freshWrapper() },
    );

    await act(async () => { await result.current.mutateAsync(); });
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith('تم الحفظ');
  });

  it('لا يعرض toast نجاح بلا successMessage', async () => {
    mocked.post.mockResolvedValue(apiEnvelope(null) as any);
    const { result } = renderHook(() => useMutate<null, void>('/api/c'), { wrapper: freshWrapper() });

    await act(async () => { await result.current.mutateAsync(); });
    expect(vi.mocked(toast.success)).not.toHaveBeenCalled();
  });

  it('onSuccess يستقبل data.data لا الـ envelope كاملاً', async () => {
    mocked.post.mockResolvedValue(apiEnvelope({ id: 42 }) as any);
    const onSuccess = vi.fn();
    const { result } = renderHook(
      () => useMutate<{ id: number }, void>('/api/c', 'post', { onSuccess }),
      { wrapper: freshWrapper() },
    );

    await act(async () => { await result.current.mutateAsync(); });
    expect(onSuccess).toHaveBeenCalledWith({ id: 42 });
  });

  it('عند الخطأ: toast بالرسالة من response.message', async () => {
    mocked.post.mockRejectedValue(
      Object.assign(new Error('x'), { response: { data: { message: 'الاسم مستخدم' } } }),
    );
    const onSuccess = vi.fn();
    const { result } = renderHook(
      () => useMutate<null, void>('/api/c', 'post', { onSuccess }),
      { wrapper: freshWrapper() },
    );

    await act(async () => { await result.current.mutateAsync().catch(() => {}); });
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith('الاسم مستخدم');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('رسالة افتراضية عند خطأ بلا response', async () => {
    mocked.post.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useMutate<null, void>('/api/c'), { wrapper: freshWrapper() });

    await act(async () => { await result.current.mutateAsync().catch(() => {}); });
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith('حدث خطأ غير متوقع');
  });

  it('isPending صحيح أثناء التنفيذ ثم ينطفئ', async () => {
    let resolve!: (v: unknown) => void;
    mocked.post.mockReturnValue(new Promise((r) => { resolve = r; }) as any);
    const { result } = renderHook(() => useMutate<null, void>('/api/c'), { wrapper: freshWrapper() });

    act(() => { result.current.mutate(); });
    await waitFor(() => expect(result.current.isPending).toBe(true));
    await act(async () => { resolve(apiEnvelope(null)); });
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});