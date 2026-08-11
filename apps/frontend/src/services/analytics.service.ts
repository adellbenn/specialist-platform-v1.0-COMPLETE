import apiClient from '@/lib/api-client';
import { DashboardStats } from '@/types';

export const analyticsService = {
  getDashboard: () =>
    apiClient.get<{ data: DashboardStats }>('/analytics/dashboard'),

  getAppointmentsTrend: () =>
    apiClient.get<{ data: Array<{ month: string; total: number; completed: number; cancelled: number }> }>(
      '/analytics/appointments-trend',
    ),

  getBeneficiariesByType: () =>
    apiClient.get<{ data: Array<{ caseType: string; count: string }> }>(
      '/analytics/beneficiaries-by-type',
    ),

  getRevenueTrend: () =>
    apiClient.get<{ data: Array<{ month: string; revenue: number }> }>(
      '/analytics/revenue-trend',
    ),
};
