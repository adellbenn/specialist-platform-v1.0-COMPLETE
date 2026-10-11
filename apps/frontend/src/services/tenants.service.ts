import apiClient from '@/lib/api-client';
import { Tenant, PaginationMeta } from '@/types';

export interface TenantQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export const tenantsService = {
  getAll: (query?: TenantQuery) =>
    apiClient.get<{ data: Tenant[]; meta: PaginationMeta }>('/tenants', { params: query }),
};
