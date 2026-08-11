import apiClient from '@/lib/api-client';
import { buildQueryString } from '@/lib/utils';
import {
  Report, ReportStats, ReportStatus, ReportType,
  ReportContent, PaginationMeta,
} from '@/types';

export interface ReportQuery {
  beneficiaryId?: string;
  specialistId?:  string;
  type?:          ReportType;
  status?:        ReportStatus;
  page?:          number;
  limit?:         number;
}

export interface CreateReportPayload {
  beneficiaryId:          string;
  type:                   ReportType;
  title:                  string;
  periodFrom?:            string;
  periodTo?:              string;
  content?:               ReportContent;
  recommendations?:       string;
  sharedWithBeneficiary?: boolean;
}

const BASE = '/reports';

export const reportsService = {
  getAll: (q: ReportQuery = {}) =>
    apiClient.get<{ data: Report[]; meta: PaginationMeta }>(`${BASE}${buildQueryString(q)}`),

  getOne: (id: string) =>
    apiClient.get<{ data: Report }>(`${BASE}/${id}`),

  getStats: () =>
    apiClient.get<{ data: ReportStats }>(`${BASE}/stats`),

  create: (payload: CreateReportPayload) =>
    apiClient.post<{ data: Report; message: string }>(BASE, payload),

  update: (id: string, payload: Partial<CreateReportPayload>) =>
    apiClient.put<{ data: Report; message: string }>(`${BASE}/${id}`, payload),

  submit: (id: string) =>
    apiClient.patch<{ data: Report; message: string }>(`${BASE}/${id}/submit`, {}),

  approve: (id: string, notes?: string) =>
    apiClient.patch<{ data: Report; message: string }>(`${BASE}/${id}/approve`, { notes }),

  toggleShare: (id: string) =>
    apiClient.patch<{ data: Report; message: string }>(`${BASE}/${id}/toggle-share`, {}),

  archive: (id: string) =>
    apiClient.delete<{ message: string }>(`${BASE}/${id}`),
};
