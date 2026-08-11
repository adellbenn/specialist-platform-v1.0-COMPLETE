'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, Trash2, Paperclip, Loader2 } from 'lucide-react';
import { filesService }         from '@/services/files.service';
import { FileAttachment, FileEntityType, formatFileSize, getFileIcon } from '@/types';
import { PermissionGate }       from '@/components/auth/permission-gate';
import { FileUploader }         from './file-uploader';
import { formatDateTime }       from '@/lib/utils';
import toast                    from 'react-hot-toast';

interface FilesListProps {
  entityType:  FileEntityType;
  entityId:    string;
  showUpload?: boolean;
  className?:  string;
}

export function FilesList({ entityType, entityId, showUpload = true, className }: FilesListProps) {
  const [files, setFiles]     = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await filesService.getEntityFiles(entityType, entityId);
      setFiles(res.data.data);
    } catch {
      toast.error('فشل تحميل الملفات');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (entityId) fetchFiles();
  }, [fetchFiles, entityId]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل تريد حذف "${name}"؟`)) return;
    setDeleting(id);
    try {
      await filesService.delete(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      toast.success('تم حذف الملف');
    } catch {
      toast.error('فشل حذف الملف');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (file: FileAttachment) => {
    const url = filesService.getDownloadUrl(file.id);
    const a   = document.createElement('a');
    a.href    = url;
    a.download = file.originalName;
    a.click();
  };

  return (
    <div className={className}>
      {/* رفع ملفات */}
      {showUpload && (
        <PermissionGate permission="file:update">
          <FileUploader
            entityType={entityType}
            entityId={entityId}
            onUpload={(f) => setFiles((prev) => [f, ...prev])}
            className="mb-4"
          />
        </PermissionGate>
      )}

      {/* قائمة الملفات */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-text-muted" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-8">
          <Paperclip size={32} className="mx-auto mb-2 text-text-muted" />
          <p className="text-sm text-text-muted">لا توجد ملفات مرفقة</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 bg-surface-secondary hover:bg-surface rounded-xl px-3 py-3 transition"
            >
              {/* الأيقونة */}
              <span className="text-2xl flex-shrink-0">{getFileIcon(file.mimeType)}</span>

              {/* المعلومات */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{file.originalName}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-text-muted">{formatFileSize(file.fileSize)}</span>
                  <span className="text-xs text-text-muted">•</span>
                  <span className="text-xs text-text-muted">{formatDateTime(file.createdAt)}</span>
                  {file.uploadedBy && (
                    <>
                      <span className="text-xs text-text-muted">•</span>
                      <span className="text-xs text-text-muted">
                        {file.uploadedBy.firstName} {file.uploadedBy.lastName}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* الأزرار */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleDownload(file)}
                  className="p-1.5 text-text-muted hover:text-primary hover:bg-primary-light rounded-lg transition"
                  title="تحميل"
                  aria-label={`تحميل ${file.originalName}`}
                >
                  <Download size={15} />
                </button>
                <PermissionGate permission="file:update">
                  <button
                    onClick={() => handleDelete(file.id, file.originalName)}
                    disabled={deleting === file.id}
                    className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-light rounded-lg transition disabled:opacity-50"
                    title="حذف"
                    aria-label={`حذف ${file.originalName}`}
                  >
                    {deleting === file.id
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Trash2 size={15} />
                    }
                  </button>
                </PermissionGate>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
