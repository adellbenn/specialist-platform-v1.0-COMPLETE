import apiClient from '@/lib/api-client';
import { buildQueryString } from '@/lib/utils';
import {
  Beneficiary, BeneficiaryFile, BeneficiaryStats,
  BeneficiaryStatus, CaseType, PaginationMeta,
} from '@/types';

export interface BeneficiaryQuery {
  search?: string;
  status?: BeneficiaryStatus;
  caseType?: CaseType;
  specialistId?: string;
  page?: number;
  limit?: number;
}

export interface CreateBeneficiaryPayload {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  nationalId?: string;
  phone?: string;
  email?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
  referralSource?: string;
  caseType: string;
  intakeDate?: string;
  notes?: string;
  assignedSpecialistId?: string;
}

const BASE = '/beneficiaries';

export const beneficiariesService = {
  getAll: (query: BeneficiaryQuery = {}) =>
    apiClient.get<{ data: Beneficiary[]; meta: PaginationMeta }>(`${BASE}${buildQueryString(query)}`),

  getOne: (id: string) =>
    apiClient.get<{ data: Beneficiary }>(`${BASE}/${id}`),

  create: (payload: CreateBeneficiaryPayload) =>
    apiClient.post<{ data: Beneficiary; message: string }>(BASE, payload),

  update: (id: string, payload: Partial<CreateBeneficiaryPayload>) =>
    apiClient.put<{ data: Beneficiary; message: string }>(`${BASE}/${id}`, payload),

  assignSpecialist: (id: string, specialistId: string) =>
    apiClient.patch<{ data: Beneficiary }>(`${BASE}/${id}/assign`, { specialistId }),

  changeStatus: (id: string, status: BeneficiaryStatus) =>
    apiClient.patch<{ data: Beneficiary }>(`${BASE}/${id}/status`, { status }),

  archive: (id: string) =>
    apiClient.delete<{ message: string }>(`${BASE}/${id}`),

  getStats: () =>
    apiClient.get<{ data: BeneficiaryStats }>(`${BASE}/stats`),

  getFile: (id: string) =>
    apiClient.get<{ data: BeneficiaryFile }>(`${BASE}/${id}/file`),

  updateFile: (id: string, payload: Partial<BeneficiaryFile>) =>
    apiClient.patch<{ data: BeneficiaryFile }>(`${BASE}/${id}/file`, payload),
};
