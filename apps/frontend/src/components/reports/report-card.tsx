'use client';

import Link from 'next/link';
import { FileText, User, Calendar, Share2, ChevronLeft, CheckCircle } from 'lucide-react';
import {
  Report,
  REPORT_TYPE_LABELS, REPORT_STATUS_LABELS, REPORT_STATUS_COLORS,
} from '@/types';
import { Badge }          from '@/components/ui/badge';
import { PermissionGate } from '@/components/auth/permission-gate';
import { formatDate }     from '@/lib/utils';
import { cn }             from '@/lib/utils';

interface ReportCardProps {
  report:         Report;
  onApprove?:     (id: string) => void;
  onToggleShare?: (id: string) => void;
}

export function ReportCard({ report: r, onApprove, onToggleShare }: ReportCardProps) {
  return (
    <div className="bg-background rounded-xl border border-border p-4 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText size={17} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{r.title}</p>
            <p className="text-xs text-text-muted">{REPORT_TYPE_LABELS[r.type]}</p>
          </div>
        </div>
        <Link href={`/dashboard/reports/${r.id}`}>
          <ChevronLeft size={16} className="text-text-muted group-hover:text-primary transition mt-1 flex-shrink-0" />
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge label={REPORT_STATUS_LABELS[r.status]} className={REPORT_STATUS_COLORS[r.status]} dot />
        {r.sharedWithBeneficiary && (
          <Badge label="مشارك مع المستفيد" className="bg-info-light text-info-text" />
        )}
      </div>

      <div className="space-y-1.5">
        {r.beneficiary && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <User size={12} className="flex-shrink-0" />
            <span>{r.beneficiary.firstName} {r.beneficiary.lastName}</span>
            <span className="font-mono text-text-muted">({r.beneficiary.fileNumber})</span>
          </div>
        )}
        {r.specialist && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <User size={12} className="flex-shrink-0" />
            <span>الأخصائي: {r.specialist.firstName} {r.specialist.lastName}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Calendar size={12} className="flex-shrink-0" />
          <span>{formatDate(r.createdAt)}</span>
        </div>
        {r.periodFrom && r.periodTo && (
          <div className="text-xs text-text-muted">
            الفترة: {formatDate(r.periodFrom)} — {formatDate(r.periodTo)}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
        {r.status === 'submitted' && onApprove && (
          <PermissionGate permission="report:approve">
            <button
              onClick={() => onApprove(r.id)}
              className="flex items-center gap-1.5 flex-1 justify-center text-xs font-medium py-1.5 bg-success text-white rounded-lg hover:opacity-90 transition"
            >
              <CheckCircle size={13} /> موافقة
            </button>
          </PermissionGate>
        )}

        {r.status === 'approved' && onToggleShare && (
          <PermissionGate permission="report:update">
            <button
              onClick={() => onToggleShare(r.id)}
              className={cn(
                'flex items-center gap-1.5 flex-1 justify-center text-xs font-medium py-1.5 rounded-lg transition',
                r.sharedWithBeneficiary
                  ? 'border border-info text-info-text bg-info-light'
                  : 'border border-border text-text-secondary hover:bg-surface',
              )}
            >
              <Share2 size={13} />
              {r.sharedWithBeneficiary ? 'إلغاء المشاركة' : 'مشاركة'}
            </button>
          </PermissionGate>
        )}

        <Link
          href={`/dashboard/reports/${r.id}`}
          className="flex items-center gap-1.5 flex-1 justify-center text-xs text-text-secondary border border-border py-1.5 rounded-lg hover:bg-surface transition"
        >
          عرض التقرير
        </Link>
      </div>
    </div>
  );
}
