import apiClient from '@/lib/api-client';
import {
  Permission, Role, RoleStats, PermissionGroup,
  EffectivePermissions, AuditLog, PaginationMeta, User,
} from '@/types';

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const adminService = {
  // Permissions
  getPermissions: () => apiClient.get<{ data: Permission[] }>('/permissions'),
  getPermissionsByModule: () => apiClient.get<{ data: Record<string, Permission[]> }>('/permissions/by-module'),
  seedPermissions: () => apiClient.post<{ data: number }>('/permissions/seed'),

  // Roles
  getRoles: () => apiClient.get<{ data: Role[] }>('/permissions/roles'),
  getRoleStats: () => apiClient.get<{ data: RoleStats }>('/permissions/roles/stats'),
  getRole: (id: string) => apiClient.get<{ data: Role }>(`/permissions/roles/${id}`),
  createRole: (data: Pick<Role, 'name' | 'description' | 'color' | 'priority'> & Partial<Pick<Role, 'icon'>>) =>
    apiClient.post<{ data: Role }>('/permissions/roles', data),
  updateRole: (id: string, data: Partial<Pick<Role, 'name' | 'description' | 'color' | 'icon' | 'priority' | 'isActive'>>) =>
    apiClient.put<{ data: Role }>(`/permissions/roles/${id}`, data),
  duplicateRole: (id: string) => apiClient.post<{ data: Role }>(`/permissions/roles/${id}/duplicate`),
  archiveRole: (id: string) => apiClient.patch<{ message: string }>(`/permissions/roles/${id}/archive`),
  deleteRole: (id: string) => apiClient.delete<{ message: string }>(`/permissions/roles/${id}`),
  bulkAssignPermissions: (roleId: string, permissionIds: string[]) =>
    apiClient.post<{ data: Role }>('/permissions/roles/bulk-permissions', { roleId, permissionIds }),
  compareRoles: (ids: string[]) =>
    apiClient.get<{ data: Role[] }>(`/permissions/roles/compare?ids=${ids.join(',')}`),

  // Permission Groups
  getGroups: () => apiClient.get<{ data: PermissionGroup[] }>('/permissions/groups'),
  getGroup: (id: string) => apiClient.get<{ data: PermissionGroup }>(`/permissions/groups/${id}`),
  seedGroups: () => apiClient.post<{ data: PermissionGroup[] }>('/permissions/groups/seed'),
  createGroup: (data: Pick<PermissionGroup, 'name' | 'description' | 'color'>) =>
    apiClient.post<{ data: PermissionGroup }>('/permissions/groups', data),
  updateGroup: (id: string, data: Partial<Pick<PermissionGroup, 'name' | 'description' | 'color' | 'isActive'>>) =>
    apiClient.put<{ data: PermissionGroup }>(`/permissions/groups/${id}`, data),
  deleteGroup: (id: string) => apiClient.delete<{ message: string }>(`/permissions/groups/${id}`),

  // User Overrides
  getUserEffective: (userId: string) =>
    apiClient.get<{ data: EffectivePermissions }>(`/permissions/users/${userId}/effective`),
  setOverride: (userId: string, permissionId: string, overrideType: 'granted' | 'denied', expiresAt?: string) =>
    apiClient.post('/permissions/users/override', { userId, permissionId, overrideType, expiresAt }),
  removeOverride: (userId: string, permissionId: string) =>
    apiClient.delete(`/permissions/users/${userId}/override/${permissionId}`),

  // Audit Logs
  getAuditLogs: (params?: AuditLogQuery) =>
    apiClient.get<{ data: AuditLog[]; meta: PaginationMeta }>('/audit-logs', { params }),
};
