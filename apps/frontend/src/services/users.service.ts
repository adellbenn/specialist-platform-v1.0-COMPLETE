import apiClient from '@/lib/api-client';
import { User, PaginationMeta } from '@/types';

export interface UserQuery {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId?: string;
}

export type UpdateUserPayload = Partial<CreateUserPayload>;

export const usersService = {
  getAll: (query?: UserQuery) =>
    apiClient.get<{ data: User[]; meta: PaginationMeta }>('/users', { params: query }),

  getOne: (id: string) =>
    apiClient.get<{ data: User }>(`/users/${id}`),

  create: (data: CreateUserPayload) =>
    apiClient.post<{ data: User; message: string }>('/users', data),

  update: (id: string, data: UpdateUserPayload) =>
    apiClient.put<{ data: User; message: string }>(`/users/${id}`, data),

  deactivate: (id: string) =>
    apiClient.patch<{ message: string }>(`/users/${id}/deactivate`),

  activate: (id: string) =>
    apiClient.patch<{ message: string }>(`/users/${id}/activate`),
};
