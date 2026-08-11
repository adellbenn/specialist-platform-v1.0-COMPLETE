import apiClient from '@/lib/api-client';
import { buildQueryString } from '@/lib/utils';
import {
  Appointment, AppointmentStats, AppointmentStatus,
  AppointmentType, Session, PaginationMeta, User,
} from '@/types';

export interface AppointmentQuery {
  specialistId?: string;
  beneficiaryId?: string;
  status?: AppointmentStatus;
  type?: AppointmentType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateAppointmentPayload {
  beneficiaryId: string;
  specialistId: string;
  scheduledAt: string;
  durationMinutes?: number;
  type?: AppointmentType;
  location?: string;
  notes?: string;
}

export interface CompleteSessionPayload {
  attendance: string;
  moodAssessment?: number;
  objectivesMet?: boolean;
  sessionNotes?: string;
  interventionsUsed?: string[];
  homeworkAssigned?: string;
  nextSessionPlan?: string;
}

export interface CalendarParams {
  specialistId?: string;
  beneficiaryId?: string;
  status?: AppointmentStatus;
  type?: AppointmentType;
}

const BASE = '/appointments';

export const appointmentsService = {
  getAll: (q: AppointmentQuery = {}) =>
    apiClient.get<{ data: Appointment[]; meta: PaginationMeta }>(`${BASE}${buildQueryString(q)}`),

  getOne: (id: string) =>
    apiClient.get<{ data: Appointment }>(`${BASE}/${id}`),

  getCalendar: (year: number, month: number, params?: CalendarParams) =>
    apiClient.get<{ data: { appointments: Appointment[]; byDay: Record<string, Appointment[]> } }>(
      `${BASE}/calendar?year=${year}&month=${month}${params ? '&' + new URLSearchParams(params as Record<string, string>).toString() : ''}`
    ),

  getToday: () =>
    apiClient.get<{ data: Appointment[] }>(`${BASE}/today`),

  getStats: () =>
    apiClient.get<{ data: AppointmentStats }>(`${BASE}/stats`),

  getSpecialists: () =>
    apiClient.get<{ data: Pick<User, 'id' | 'firstName' | 'lastName'>[] }>('/users?role=specialist'),

  create: (payload: CreateAppointmentPayload) =>
    apiClient.post<{ data: Appointment; message: string }>(BASE, payload),

  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`${BASE}/${id}`),

  update: (id: string, payload: Partial<CreateAppointmentPayload>) =>
    apiClient.put<{ data: Appointment; message: string }>(`${BASE}/${id}`, payload),

  confirm: (id: string) =>
    apiClient.patch<{ data: Appointment; message: string }>(`${BASE}/${id}/confirm`, {}),

  cancel: (id: string, reason: string) =>
    apiClient.patch<{ data: Appointment; message: string }>(`${BASE}/${id}/cancel`, { reason }),

  markNoShow: (id: string) =>
    apiClient.patch<{ data: Appointment; message: string }>(`${BASE}/${id}/no-show`, {}),

  complete: (id: string, payload: CompleteSessionPayload) =>
    apiClient.patch<{ data: { appointment: Appointment; session: Session }; message: string }>(
      `${BASE}/${id}/complete`, payload
    ),
};
