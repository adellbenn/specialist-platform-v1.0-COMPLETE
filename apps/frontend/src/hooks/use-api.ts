import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

/**
 * Hook عام لجلب البيانات — يُغلّف React Query
 */
export function useFetch<T>(
  key: readonly (string | object)[],
  url: string,
  options?: { enabled?: boolean; staleTime?: number },
) {
  return useQuery<ApiResponse<T>, AxiosError>({
    queryKey: key,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<T>>(url);
      return data;
    },
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 دقائق افتراضياً
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook عام للعمليات التي تعدّل البيانات (POST, PUT, DELETE)
 */
export function useMutate<TData, TVariables>(
  url: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  options?: {
    invalidateKeys?: readonly (string | object)[][];
    successMessage?: string;
    onSuccess?: (data: TData) => void;
  },
) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TData>, AxiosError, TVariables>({
    mutationFn: async (variables) => {
      const { data } = method === 'delete'
        ? await apiClient.delete<ApiResponse<TData>>(url)
        : await apiClient[method]<ApiResponse<TData>>(url, variables);
      return data;
    },
    onSuccess: (data) => {
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((key) =>
          queryClient.invalidateQueries({ queryKey: key }),
        );
      }
      options?.onSuccess?.(data.data);
    },
    onError: (error) => {
      const message = (error?.response?.data as { message?: string })?.message || 'حدث خطأ غير متوقع';
      toast.error(message);
    },
  });
}
