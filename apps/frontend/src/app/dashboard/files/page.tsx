'use client';

import { useState, useEffect, useCallback } from 'react';
import { FolderOpen, Upload, Download, Trash2, FileText, Image, File, Link } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useRouteGuard } from '@/components/auth/route-guard';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface FileItem {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  entityType: string;
  entityId: string;
  beneficiaryId: string | null;
  beneficiary?: { firstName: string; lastName: string } | null;
  createdAt: string;
}

const FILE_ICONS: Record<string, any> = {
  'application/pdf': FileText,
  'image/': Image,
};

function getFileIcon(mime: string) {
  for (const [key, Icon] of Object.entries(FILE_ICONS)) {
    if (mime.startsWith(key)) return Icon;
  }
  return File;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FILE_TYPES = [
  { value: '', label: 'جميع الملفات' },
  { value: 'application/pdf', label: 'PDF' },
  { value: 'image/', label: 'صور' },
  { value: 'application/msword', label: 'Word' },
  { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel' },
];

const ENTITY_TYPES = [
  { value: 'beneficiary', label: 'مستفيد' },
  { value: 'session',     label: 'جلسة' },
  { value: 'report',      label: 'تقرير' },
  { value: 'invoice',     label: 'فاتورة' },
];

export default function FilesPage() {
  useRouteGuard({ anyRole: ['super_admin', 'center_manager', 'supervisor', 'specialist'], redirectTo: '/dashboard' });
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [entityType, setEntityType] = useState('beneficiary');
  const [entityId, setEntityId] = useState('');

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '24' });
      if (typeFilter) params.append('mimeType', typeFilter);
      const res = await apiClient.get<{ data: FileItem[]; meta: { total: number } }>(`/files?${params}`);
      setFiles(res.data.data);
      setTotal(res.data.meta?.total ?? 0);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);
  useEffect(() => { setPage(1); }, [typeFilter]);

  const handleUpload = async () => {
    if (!entityId) {
      toast.error('يرجى إدخال معرف الكيان');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const form = new FormData();
      form.append('file', file);
      try {
        await apiClient.post(`/files/upload?entityType=${entityType}&entityId=${entityId}`, form);
        toast.success('تم رفع الملف بنجاح');
        fetchFiles();
      } catch {
        toast.error('فشل رفع الملف');
      }
    };
    input.click();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
    try {
      await apiClient.delete(`/files/${id}`);
      toast.success('تم حذف الملف');
      fetchFiles();
    } catch {
      toast.error('فشل حذف الملف');
    }
  };

  const handleDownload = async (id: string, name: string) => {
    try {
      const res = await apiClient.get(`/files/${id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
    } catch {
      toast.error('فشل تحميل الملف');
    }
  };

  const totalPages = Math.ceil(total / 24);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FolderOpen size={20} style={{ color: 'var(--primary)' }} />
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>الملفات</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{total} ملف</p>
          </div>
        </div>
        <button onClick={handleUpload}
          className="flex items-center gap-1.5 text-white text-sm px-4 py-2 rounded-lg transition"
          style={{ backgroundColor: 'var(--primary)' }}>
          <Upload size={14} /> رفع ملف
        </button>
      </div>

      <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap gap-3">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm rounded-lg px-3 py-2 focus:outline-none"
            style={{ borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
            {FILE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select value={entityType} onChange={(e) => setEntityType(e.target.value)}
            className="text-sm rounded-lg px-3 py-2 focus:outline-none"
            style={{ borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
            {ENTITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input type="text" dir="ltr" placeholder="معرف الكيان (UUID)" value={entityId} onChange={(e) => setEntityId(e.target.value)}
            className="text-sm rounded-lg px-3 py-2 focus:outline-none flex-1 min-w-[200px]"
            style={{ borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }} />
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>اختر نوع ومعرف الكيان قبل رفع ملف. لعرض ملفات كيان معين أضف entityType=beneficiary&amp;entityId=UUID إلى رابط الصفحة.</p>
      </div>

      {loading ? (
        <PageLoader />
      ) : files.length === 0 ? (
        <EmptyState icon={FolderOpen} title="لا توجد ملفات" description="لم يتم رفع أي ملفات بعد"
          action={
            <button onClick={handleUpload}
              className="flex items-center gap-2 text-white text-sm px-4 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--primary)' }}>
              <Upload size={14} /> رفع ملف
            </button>
          }
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {files.map((f) => {
              const Icon = getFileIcon(f.mimeType);
              return (
                <div key={f.id} className="rounded-xl p-4 transition group hover:shadow-card-hover"
                  style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--surface)' }}>
                      <Icon size={20} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{f.originalName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatSize(f.size)}</p>
                    </div>
                  </div>
                  {f.beneficiary && (
                    <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                      المستفيد: {f.beneficiary.firstName} {f.beneficiary.lastName}
                    </p>
                  )}
                  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{formatDateTime(f.createdAt)}</p>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => handleDownload(f.id, f.originalName)}
                      className="flex items-center gap-1 text-xs bg-primary-light text-primary px-2.5 py-1.5 rounded-lg hover:bg-primary-light">
                      <Download size={12} /> تحميل
                    </button>
                    <button onClick={() => handleDelete(f.id, f.originalName)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-danger-light text-danger hover:bg-danger-light hover:text-danger">
                      <Trash2 size={12} /> حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 hover:bg-[var(--surface-secondary)]"
                style={{ borderColor: 'var(--border)' }}>السابق</button>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 hover:bg-[var(--surface-secondary)]"
                style={{ borderColor: 'var(--border)' }}>التالي</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
