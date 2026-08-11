import apiClient from '@/lib/api-client';

export interface SearchQuery {
  q: string;
  type?: 'beneficiaries' | 'users' | 'appointments' | 'files' | 'all';
  page?: number;
  limit?: number;
}

export interface SearchResultItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  link: string;
}

export const searchService = {
  search: (query: SearchQuery) =>
    apiClient.get<{ data: SearchResultItem[]; meta: { total: number } }>('/search', { params: query }),
};
