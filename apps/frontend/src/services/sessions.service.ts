import apiClient from '@/lib/api-client';
import { Session, SessionStats, PaginationMeta } from '@/types';

export interface SessionQuery {
  page?: number;
  limit?: number;
  beneficiaryId?: string;
  specialistId?: string;
  status?: string;
  attendance?: string;
}

export interface CreateSessionPayload {
  beneficiaryId: string;
  specialistId: string;
  appointmentId?: string;
  sessionNumber: number;
  startedAt: string;
  attendance?: string;
  moodAssessment?: number;
  objectivesMet?: boolean;
  sessionNotes?: string;
  interventionsUsed?: string[];
  homeworkAssigned?: string;
  nextSessionPlan?: string;
}

export const sessionsService = {
  getAll: (query?: SessionQuery) =>
    apiClient.get<{ data: Session[]; meta: PaginationMeta }>('/sessions', { params: query }),

  getOne: (id: string) =>
    apiClient.get<{ data: Session }>(`/sessions/${id}`),

  create: (data: CreateSessionPayload) =>
    apiClient.post<{ data: Session; message: string }>('/sessions', data),

  update: (id: string, data: Partial<CreateSessionPayload>) =>
    apiClient.put<{ data: Session; message: string }>(`/sessions/${id}`, data),

  getStats: () =>
    apiClient.get<{ data: SessionStats }>('/sessions/stats'),
};
