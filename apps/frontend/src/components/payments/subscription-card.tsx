'use client';

import { User, Calendar, Hash, TrendingUp, XCircle } from 'lucide-react';
import {
  Subscription,
  SUBSCRIPTION_STATUS_LABELS, SUBSCRIPTION_STATUS_COLORS,
} from '@/types';
import { Badge }          from '@/components/ui/badge';
import { PermissionGate } from '@/components/auth/permission-gate';
import { formatDate, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SubscriptionCardProps {
  subscription:  Subscription;
  onCancel?:     (id: string) => void;
}

export function SubscriptionCard({ subscription: sub, onCancel }: SubscriptionCardProps) {
  const totalSessions = sub.sessionsUsed + sub.sessionsRemaining;
  const progress = totalSessions > 0 ? (sub.sessionsUsed / totalSessions) * 100 : 0;
  const isExpired = new Date(sub.expiryDate) < new Date();

  return (
    <div className="bg-background rounded-xl border border-border p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          {sub.beneficiary && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                {sub.beneficiary.firstName[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {sub.beneficiary.firstName} {sub.beneficiary.lastName}
                </p>
                <p className="text-xs text-text-muted font-mono">{sub.beneficiary.fileNumber}</p>
              </div>
            </div>
          )}
        </div>
        <Badge label={SUBSCRIPTION_STATUS_LABELS[sub.status]} className={SUBSCRIPTION_STATUS_COLORS[sub.status]} dot />
      </div>

      {sub.package && (
        <div className="flex items-center gap-2 text-xs text-text-secondary bg-surface rounded-lg px-2.5 py-1.5 mb-3">
          <Hash size={12} />
          <span className="font-medium">{sub.package.name}</span>
        </div>
      )}

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
          <span>الجلسات</span>
          <span className="font-semibold text-text-primary">
            {sub.sessionsUsed} / {totalSessions}
          </span>
        </div>
        <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', progress > 80 ? 'bg-danger' : progress > 50 ? 'bg-warning' : 'bg-primary')}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-text-muted">{sub.sessionsRemaining} متبقية</span>
          {isExpired && <span className="text-xs text-danger">منتهي الصلاحية</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar size={11} />
          <span>{formatDate(sub.startDate)}</span>
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          <span>{formatDate(sub.expiryDate)}</span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2">
          <TrendingUp size={11} />
          <span>المدفوع: {formatCurrency(Number(sub.amountPaid))}</span>
          {Number(sub.discountAmount) > 0 && (
            <span className="text-success">
              (خصم {formatCurrency(Number(sub.discountAmount))})
            </span>
          )}
        </div>
      </div>

      {sub.status === 'active' && onCancel && (
        <PermissionGate permission="payment:update">
          <button
            onClick={() => onCancel(sub.id)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs border border-danger/30 text-danger rounded-lg hover:bg-danger-light transition"
          >
            <XCircle size={13} /> إلغاء الاشتراك
          </button>
        </PermissionGate>
      )}
    </div>
  );
}
