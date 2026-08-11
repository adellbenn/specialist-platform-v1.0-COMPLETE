import apiClient from '@/lib/api-client';
import { buildQueryString } from '@/lib/utils';
import {
  ServicePackage, Subscription, Invoice,
  PaymentStats, PaymentStatus, PaymentMethod, PaginationMeta,
} from '@/types';

export interface SubscriptionQuery {
  beneficiaryId?: string;
  status?:        string;
  page?:          number;
  limit?:         number;
}

export interface InvoiceQuery {
  beneficiaryId?: string;
  paymentStatus?: PaymentStatus;
  dateFrom?:      string;
  dateTo?:        string;
  page?:          number;
  limit?:         number;
}

export interface CreateSubscriptionPayload {
  beneficiaryId:  string;
  packageId?:     string;
  sessionsCount:  number;
  amountPaid:     number;
  discountAmount?: number;
  startDate:      string;
  expiryDate:     string;
}

export interface CreateInvoicePayload {
  beneficiaryId:   string;
  subscriptionId?: string;
  amount:          number;
  discount?:       number;
  tax?:            number;
  paymentMethod?:  PaymentMethod;
  paymentStatus?:  PaymentStatus;
  notes?:          string;
}

export interface CreatePackagePayload {
  name: string;
  description?: string;
  sessionsCount: number;
  price: number;
  validityDays: number;
}

const BASE = '/payments';

export const paymentsService = {
  getStats: () =>
    apiClient.get<{ data: PaymentStats }>(`${BASE}/stats`),

  getPackages:    () => apiClient.get<{ data: ServicePackage[] }>(`${BASE}/packages`),
  getAllPackages:  () => apiClient.get<{ data: ServicePackage[] }>(`${BASE}/packages/all`),
  createPackage:  (p: CreatePackagePayload) => apiClient.post<{ data: ServicePackage }>(`${BASE}/packages`, p),
  updatePackage:  (id: string, p: Partial<CreatePackagePayload>) => apiClient.put<{ data: ServicePackage }>(`${BASE}/packages/${id}`, p),

  getSubscriptions: (q: SubscriptionQuery = {}) =>
    apiClient.get<{ data: Subscription[]; meta: PaginationMeta }>(`${BASE}/subscriptions${buildQueryString(q)}`),
  getSubscription: (id: string) =>
    apiClient.get<{ data: Subscription }>(`${BASE}/subscriptions/${id}`),
  getActiveSubscription: (beneficiaryId: string) =>
    apiClient.get<{ data: Subscription | null }>(`${BASE}/subscriptions/beneficiary/${beneficiaryId}/active`),
  createSubscription: (p: CreateSubscriptionPayload) =>
    apiClient.post<{ data: Subscription; message: string }>(`${BASE}/subscriptions`, p),
  cancelSubscription: (id: string) =>
    apiClient.patch<{ data: Subscription; message: string }>(`${BASE}/subscriptions/${id}/cancel`, {}),

  getInvoices: (q: InvoiceQuery = {}) =>
    apiClient.get<{ data: Invoice[]; meta: PaginationMeta }>(`${BASE}/invoices${buildQueryString(q)}`),
  getInvoice:  (id: string) =>
    apiClient.get<{ data: Invoice }>(`${BASE}/invoices/${id}`),
  createInvoice: (p: CreateInvoicePayload) =>
    apiClient.post<{ data: Invoice; message: string }>(`${BASE}/invoices`, p),
  markPaid: (id: string, paymentMethod: PaymentMethod, notes?: string) =>
    apiClient.patch<{ data: Invoice; message: string }>(`${BASE}/invoices/${id}/pay`, { paymentMethod, notes }),
  refund: (id: string) =>
    apiClient.patch<{ data: Invoice; message: string }>(`${BASE}/invoices/${id}/refund`, {}),
};
