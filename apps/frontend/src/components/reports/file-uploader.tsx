'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { filesService } from '@/services/files.service';
import { FileAttachment, FileEntityType, formatFileSize, getFileIcon } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface FileUploaderProps {
  entityType: FileEntityType;
  entityId:   string;
  onUpload?:  (file: FileAttachment) => void;
  accept?:    string;
  maxSizeMB?: number;
  className?: string;
}

interface UploadItem {
  file:     File;
  progress: number;
  status:   'pending' | 'uploading' | 'done' | 'error';
  error?:   string;
  result?:  FileAttachment;
}

export function FileUploader({
  entityType,
  entityId,
  onUpload,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png',
  maxSizeMB = 10,
  className,
}: FileUploaderProps) {
  const [items, setItems]   = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateItem = useCallback((idx: number, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  }, []);

  const uploadFile = useCallback(async (file: File, idx: number) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      updateItem(idx, { status: 'error', error: `الحجم يتجاوز ${maxSizeMB}MB` });
      return;
    }

    updateItem(idx, { status: 'uploading' });
    try {
      const res = await filesService.upload(file, entityType, entityId, (pct) => {
        updateItem(idx, { progress: pct });
      });
      updateItem(idx, { status: 'done', result: res.data.data, progress: 100 });
      onUpload?.(res.data.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'فشل الرفع';
      updateItem(idx, { status: 'error', error: msg });
      toast.error(msg);
    }
  }, [updateItem, maxSizeMB, entityType, entityId, onUpload]);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newItems: UploadItem[] = Array.from(files).map((f) => ({
      file: f, progress: 0, status: 'pending',
    }));
    setItems((prev) => {
      const startIdx = prev.length;
      newItems.forEach((_, i) => {
        setTimeout(() => uploadFile(newItems[i].file, startIdx + i), i * 100);
      });
      return [...prev, ...newItems];
    });
  }, [uploadFile]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition',
          isDragging
            ? 'border-primary bg-primary-light'
            : 'border-border hover:border-primary hover:bg-surface-secondary',
        )}
      >
        <Upload size={24} className={cn('mx-auto mb-2', isDragging ? 'text-primary' : 'text-text-muted')} />
        <p className="text-sm font-medium text-text-secondary">
          اسحب الملفات هنا أو <span className="text-primary">اختر من جهازك</span>
        </p>
        <p className="text-xs text-text-muted mt-1">
          PDF, Word, Excel, الصور — حتى {maxSizeMB}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Upload Items */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-surface-secondary rounded-lg px-3 py-2.5">
              {/* أيقونة النوع */}
              <span className="text-xl flex-shrink-0">
                {getFileIcon(item.file.type)}
              </span>

              {/* معلومات الملف */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{item.file.name}</p>
                <p className="text-xs text-text-muted">{formatFileSize(item.file.size)}</p>

                {/* Progress Bar */}
                {item.status === 'uploading' && (
                  <div className="mt-1.5 h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {item.status === 'error' && (
                  <p className="text-xs text-danger mt-0.5">{item.error}</p>
                )}
              </div>

              {/* Status Icon */}
              <div className="flex-shrink-0">
                {item.status === 'uploading' && (
                  <Loader2 size={16} className="text-primary animate-spin" />
                )}
                {item.status === 'done' && (
                  <CheckCircle size={16} className="text-success" />
                )}
                {item.status === 'error' && (
                  <AlertCircle size={16} className="text-danger" />
                )}
                {item.status === 'pending' && (
                  <button onClick={() => removeItem(idx)}>
                    <X size={15} className="text-text-muted hover:text-danger" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
