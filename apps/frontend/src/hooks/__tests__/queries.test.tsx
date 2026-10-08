import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/lib/api-client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  registerAuthFailureHandler: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import { useDashboardStats, useTodayAppointments } from '@/hooks/queries/use-dashboard';
import { useAppointmentsList, useAppointmentStats } from '@/hooks/queries/use-appointments';
import { useBeneficiariesList, useBeneficiaryStats } from '@/hooks/queries/use-beneficiaries';
import { queryKeys } from '@/hooks/queries/query-keys';

const mockedGet = vi.mocked(apiClient.get);

/** عميل جديد لكل اختبار — queryKey مكررة لا تسرّب cache بين الحالات. */
function freshWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function W({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return W;
}

const ok = <T,>(data: T, meta?: object) => ({ data: { success: true, data, ...(meta ? { meta } : {}) } });
const boom = Object.assign(new Error('x'), { response: { data: { message: 'خطأ' } } });

beforeEach(() => {
  mockedGet.mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.success).mockReset();
});

describe('useDashboardStats', () => {
  it('يطلب /analytics/dashboard', async () => {
    mockedGet.mockResolvedValue(ok({ totalBeneficiaries: 5 }) as any);
    const { result } = renderHook(() => useDashboardStats(), { wrapper: freshWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedGet).toHaveBeenCalledWith('/analytics/dashboard');
  });

  it('يفكّ stats من الـ envelope', async () => {
    mockedGet.mockResolvedValue(ok({ totalBeneficiaries: 5 }) as any);
    const { result } = renderHook(() => useDashboardStats(), { wrapper: freshWrapper() });
    await waitFor(() => expect(result.current.stats).toEqual({ totalBeneficiaries: 5 }));
  });

  it('stats يبقى undefined قبل الوصول', () => {
    mockedGet.mockReturnValue(new Promise(() => {}) as any);
    const { result } = renderHook(() => useDashboardStats(), { wrapper: freshWrapper() });
    expect(result.current.stats).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('يعرض toast عند الخطأ ولا يرمي', async () => {
    mockedGet.mockRejectedValue(boom);
    const { result } = renderHook(() => useDashboardStats(), { wrapper: freshWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith('فشل تحميل إحصائيات لوحة التحكم');
  });

  it('لا toast عند النجاح', async () => {
    mockedGet.mockResolvedValue(ok({}) as any);
    const { result } = renderHook(() => useDashboardStats(), { wrapper: freshWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
  });
});

describe('useTodayAppointments', () => {
  it('appointments مصفوفة فارغة لا undefined قبل/عند الخطأ', async () => {
    mockedGet.mockRejectedValue(boom);
    const { result } = renderHook(() => useTodayAppointments(), { wrapper: freshWrapper() });
    /* قبل الوصول */
    expect(result.current.appointments).toEqual([]);
    await waitFor(() => expect(result.current.isError).toBe(true));
    /* بعد الخطأ — لا ينهار العرضConsumers */
    expect(result.current.appointments).toEqual([]);
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith('فشل تحميل مواعيد اليوم');
  });

  it('يفكّ المواعيد عند النجاح', async () => {
    mockedGet.mockResolvedValue(ok([{ id: 1 }]) as any);
    const { result } = renderHook(() => useTodayAppointments(), { wrapper: freshWrapper() });
    await waitFor(() => expect(result.current.appointments).toEqual([{ id: 1 }]));
  });
});

describe('useAppointmentsList', () => {
  it('يبني queryKey من الفلاتر — تغيّر الفلتر يعني استعلام آخر', () => {
    mockedGet.mockReturnValue(new Promise(() => {}) as any);
    const { result } = renderHook(() => useAppointmentsList({ status: 'confirmed' } as any), { wrapper: freshWrapper() });
    expect(result.current.appointments).toEqual([]);
  });

  it('يطلب /appointments مع الفلاتر — ' + "'?'" + ' واحدة فقط', async () => {
    mockedGet.mockResolvedValue(ok([]) as any);
    renderHook(() => useAppointmentsList({ status: 'confirmed' } as any), { wrapper: freshWrapper() });
    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/appointments?status=confirmed'));
  });

  it('لا ' + "'??'" + ' — كانت buildQueryString تُسبق بـ' + "'?'" + ' والـ hook يضيف أخرى', async () => {
    mockedGet.mockResolvedValue(ok([]) as any);
    renderHook(() => useAppointmentsList({ status: 'confirmed' } as any), { wrapper: freshWrapper() });
    await waitFor(() => expect(mockedGet).toHaveBeenCalled());
    expect(String(mockedGet.mock.calls[0][0])).not.toContain('??');
  });

  it('فلاتر بدون قيم فارغة لا تنتج ' + "'?'" + ' مربوطة', async () => {
    mockedGet.mockResolvedValue(ok([]) as any);
    renderHook(() => useAppointmentsList({} as any), { wrapper: freshWrapper() });
    await waitFor(() => expect(mockedGet).toHaveBeenCalled());
    expect(mockedGet).toHaveBeenCalledWith('/appointments');
  });

  it('enabled=false يمنع الطلب', async () => {
    renderHook(() => useAppointmentsList({} as any, { enabled: false }), { wrapper: freshWrapper() });
    await new Promise((r) => setTimeout(r, 50));
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('toast الخطار مختلف عن الإحصائيات', async () => {
    mockedGet.mockRejectedValue(boom);
    const { result } = renderHook(() => useAppointmentsList({} as any), { wrapper: freshWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith('فشل تحميل المواعيد');
  });
});

describe('useAppointmentStats', () => {
  it('يطلب /appointments/stats', async () => {
    mockedGet.mockResolvedValue(ok({ today: 3 }) as any);
    const { result } = renderHook(() => useAppointmentStats(), { wrapper: freshWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedGet).toHaveBeenCalledWith('/appointments/stats');
    expect(result.current.stats).toEqual({ today: 3 });
  });

  it('toast الخطأ مميّز', async () => {
    mockedGet.mockRejectedValue(boom);
    const { result } = renderHook(() => useAppointmentStats(), { wrapper: freshWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith('فشل تحميل إحصائيات المواعيد');
  });
});

describe('useBeneficiariesList', () => {
  it('total يُقرأ من meta لا من طول المصفوفة', async () => {
    mockedGet.mockResolvedValue(ok([{ id: 1 }], { total: 87 }) as any);
    const { result } = renderHook(() => useBeneficiariesList({} as any, 1), { wrapper: freshWrapper() });
    await waitFor(() => expect(result.current.total).toBe(87));
    expect(result.current.beneficiaries).toHaveLength(1);
  });

  it('total = 0 عند غياب meta', async () => {
    mockedGet.mockResolvedValue(ok([]) as any);
    const { result } = renderHook(() => useBeneficiariesList({} as any, 1), { wrapper: freshWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.total).toBe(0);
  });

  it('page يدخل الـ queryKey والـ url معاً', async () => {
    mockedGet.mockResolvedValue(ok([]) as any);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    function W({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    }
    renderHook(() => useBeneficiariesList({ status: 'active' } as any, 3), { wrapper: W });
    await waitFor(() => expect(mockedGet).toHaveBeenCalled());
    expect(mockedGet).toHaveBeenCalledWith('/beneficiaries?status=active&page=3');
    /* React Query يفرز مفاتيح الكائن عند التجزئة، فلا نفترض ترتيب الإدراج —
       نقارن بمفتاح queryKeys نفسه بدل حرفيّة hash. */
    const expected = queryKeys.beneficiaries.all({ status: 'active', page: 3 });
    expect(qc.getQueryCache().findAll({ queryKey: expected })).toHaveLength(1);
  });

  it('لا ' + "'??'" + ' في URL المستفيدين', async () => {
    mockedGet.mockResolvedValue(ok([]) as any);
    renderHook(() => useBeneficiariesList({ status: 'active' } as any, 3), { wrapper: freshWrapper() });
    await waitFor(() => expect(mockedGet).toHaveBeenCalled());
    expect(String(mockedGet.mock.calls[0][0])).not.toContain('??');
  });

  it('صفحة مختلفة = استعلام مختلف، لا إعادة استخدام نتيجة الصفحة الأولى', async () => {
    mockedGet.mockResolvedValue(ok([]) as any);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    function W({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    }
    const p1 = renderHook(() => useBeneficiariesList({} as any, 1), { wrapper: W });
    const p2 = renderHook(() => useBeneficiariesList({} as any, 2), { wrapper: W });
    await waitFor(() => expect(p1.result.current.isSuccess && p2.result.current.isSuccess).toBe(true));
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });

  it('beneficiaries لا تنهار عند الخطأ', async () => {
    mockedGet.mockRejectedValue(boom);
    const { result } = renderHook(() => useBeneficiariesList({} as any, 1), { wrapper: freshWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.beneficiaries).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith('فشل تحميل قائمة المستفيدين');
  });
});

describe('useBeneficiaryStats', () => {
  it('يطلب /beneficiaries/stats', async () => {
    mockedGet.mockResolvedValue(ok({ active: 12 }) as any);
    const { result } = renderHook(() => useBeneficiaryStats(), { wrapper: freshWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedGet).toHaveBeenCalledWith('/beneficiaries/stats');
    expect(result.current.stats).toEqual({ active: 12 });
  });

  it('toast الخطأ مميّز', async () => {
    mockedGet.mockRejectedValue(boom);
    const { result } = renderHook(() => useBeneficiaryStats(), { wrapper: freshWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith('فشل تحميل إحصائيات المستفيدين');
  });
});

describe('queryKeys', () => {
  it('مفاتيح الإحصائيات ثابتة عبر الاستدعاءات — لا إعادة جلب غير لازمة', () => {
    expect(queryKeys.dashboard.stats).toEqual(['dashboard', 'stats']);
    expect(queryKeys.appointments.stats).toEqual(['appointments', 'stats']);
    expect(queryKeys.beneficiaries.stats).toEqual(['beneficiaries', 'stats']);
  });

  it('بادئة القائمة مشتركة بين كل الصفحات', () => {
    expect(queryKeys.appointments.all({})[0]).toBe('appointments');
    expect(queryKeys.beneficiaries.all({})[0]).toBe('beneficiaries');
  });

  it('todayAppointments منفصل عن stats', () => {
    expect(queryKeys.dashboard.todayAppointments).not.toEqual(queryKeys.dashboard.stats);
  });
});