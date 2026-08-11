import apiClient from '@/lib/api-client';

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

const BASE = '/notifications';

export const notificationsService = {
  getAll: (page = 1, limit = 20) =>
    apiClient.get<{ data: AppNotification[]; meta: NotificationsMeta }>(
      `${BASE}?page=${page}&limit=${limit}`,
    ),

  getUnreadCount: () =>
    apiClient.get<{ data: { count: number } }>(`${BASE}/unread-count`),

  markRead: (id: string) =>
    apiClient.patch<{ message: string }>(`${BASE}/${id}/read`, {}),

  markAllRead: () =>
    apiClient.patch<{ message: string }>(`${BASE}/read-all`, {}),
};
