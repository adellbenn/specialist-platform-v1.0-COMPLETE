'use client';

import { Clock, User, MapPin, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import {
  Appointment,
  APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
} from '@/types';
import { Badge } from '@/components/ui/badge';
import { PermissionGate } from '@/components/auth/permission-gate';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AppointmentCardProps {
  appointment: Appointment;
  onConfirm?:  (id: string) => void;
  onCancel?:   (id: string) => void;
  onComplete?: (id: string) => void;
  compact?:    boolean;
}

export function AppointmentCard({
  appointment: a,
  onConfirm,
  onCancel,
  onComplete,
  compact = false,
}: AppointmentCardProps) {
  const isPast      = new Date(a.scheduledAt) < new Date();
  const canAct      = !['completed', 'cancelled', 'no_show'].includes(a.status);
  const isScheduled = a.status === 'scheduled';
  const isConfirmed = a.status === 'confirmed';

  return (
    <div className={cn(
      'bg-background rounded-xl border border-border hover:shadow-md transition-all',
      compact ? 'p-3' : 'p-4',
    )}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge label={APPOINTMENT_STATUS_LABELS[a.status]} className={APPOINTMENT_STATUS_COLORS[a.status]} dot />
          <Badge label={APPOINTMENT_TYPE_LABELS[a.type]} className="bg-surface-secondary text-text-secondary" />
        </div>
        <Link href={`/dashboard/appointments/${a.id}`}>
          <ChevronLeft size={16} className="text-text-muted hover:text-primary transition mt-0.5" />
        </Link>
      </div>

      <div className="flex items-center gap-2 text-text-primary mb-2">
        <Clock size={15} className="text-primary flex-shrink-0" />
        <span className="text-sm font-semibold">{formatDateTime(a.scheduledAt)}</span>
        <span className="text-xs text-text-muted">({a.durationMinutes} دقيقة)</span>
      </div>

      {!compact && (
        <>
          {a.beneficiary && (
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-1.5">
              <User size={14} className="text-text-muted flex-shrink-0" />
              <span>
                {a.beneficiary.firstName} {a.beneficiary.lastName}
                <span className="text-xs text-text-muted mr-1 font-mono">({a.beneficiary.fileNumber})</span>
              </span>
            </div>
          )}

          {a.specialist && (
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-1.5">
              <User size={14} className="text-text-muted flex-shrink-0" />
              <span>{a.specialist.firstName} {a.specialist.lastName}</span>
            </div>
          )}

          {a.location && (
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-1.5">
              <MapPin size={14} className="text-text-muted flex-shrink-0" />
              <span>{a.location}</span>
            </div>
          )}

          {a.notes && (
            <p className="text-xs text-text-muted mt-2 bg-surface px-3 py-2 rounded-lg line-clamp-2">
              {a.notes}
            </p>
          )}
        </>
      )}

      {canAct && (
        <PermissionGate permission="appointment:confirm">
          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
            {isScheduled && onConfirm && (
              <button
                onClick={() => onConfirm(a.id)}
                className="flex-1 text-xs font-medium py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition"
              >
                تأكيد
              </button>
            )}
            {(isScheduled || isConfirmed) && onComplete && !isPast === false && (
              <button
                onClick={() => onComplete(a.id)}
                className="flex-1 text-xs font-medium py-1.5 bg-success text-white rounded-lg hover:opacity-90 transition"
              >
                إتمام الجلسة
              </button>
            )}
            {onCancel && (
              <button
                onClick={() => onCancel(a.id)}
                className="flex-1 text-xs font-medium py-1.5 border border-danger/30 text-danger rounded-lg hover:bg-danger-light transition"
              >
                إلغاء
              </button>
            )}
          </div>
        </PermissionGate>
      )}
    </div>
  );
}
