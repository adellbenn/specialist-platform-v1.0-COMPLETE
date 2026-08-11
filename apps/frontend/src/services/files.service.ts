import apiClient from '@/lib/api-client';
import { FileAttachment, FileEntityType } from '@/types';

const BASE = '/files';

export const filesService = {
  /** رفع ملف مرتبط بكيان */
  upload: (
    file: File,
    entityType: FileEntityType,
    entityId: string,
    onProgress?: (pct: number) => void,
  ) => {
    const form = new FormData();
    form.append('file', file);

    return apiClient.post<{ data: FileAttachment; message: string }>(
      `${BASE}/upload?entityType=${entityType}&entityId=${entityId}`,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      },
    );
  },

  /** جلب ملفات كيان */
  getEntityFiles: (entityType: FileEntityType, entityId: string) =>
    apiClient.get<{ data: FileAttachment[] }>(
      `${BASE}?entityType=${entityType}&entityId=${entityId}`,
    ),

  /** رابط تحميل مباشر */
  getDownloadUrl: (id: string) => `${process.env.NEXT_PUBLIC_API_URL ?? '/api/v1'}${BASE}/${id}/download`,

  /** حذف ملف */
  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`${BASE}/${id}`),
};
