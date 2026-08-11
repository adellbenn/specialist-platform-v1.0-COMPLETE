'use client';

import Link from 'next/link';
import { FileText, User, CreditCard, ChevronLeft, CheckCircle } from 'lucide-react';
import {
  Invoice,
  PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
} from '@/types';
import { Badge }          from '@/components/ui/badge';
import { PermissionGate } from '@/components/auth/permission-gate';
import { formatDate, formatCurrency } from '@/lib/utils';

interface InvoiceCardProps {
  invoice:    Invoice;
  onMarkPaid?: (id: string) => void;
}

export function InvoiceCard({ invoice: inv, onMarkPaid }: InvoiceCardProps) {
  return (
    <div className="bg-background rounded-xl border border-border p-4 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 bg-success-light rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText size={17} className="text-success" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary font-mono">{inv.invoiceNumber}</p>
            <p className="text-xs text-text-muted">{formatDate(inv.createdAt)}</p>
          </div>
        </div>
        <Link href={`/dashboard/payments/invoices/${inv.id}`}>
          <ChevronLeft size={16} className="text-text-muted group-hover:text-primary transition mt-1" />
        </Link>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-bold text-text-primary">
          {formatCurrency(Number(inv.total))}
        </span>
        <Badge label={PAYMENT_STATUS_LABELS[inv.paymentStatus]} className={PAYMENT_STATUS_COLORS[inv.paymentStatus]} dot />
      </div>

      {inv.beneficiary && (
        <div className="flex items-center gap-2 text-xs text-text-secondary mb-1.5">
          <User size={12} className="flex-shrink-0" />
          <span>{inv.beneficiary.firstName} {inv.beneficiary.lastName}</span>
          <span className="font-mono text-text-muted">({inv.beneficiary.fileNumber})</span>
        </div>
      )}

      {inv.paymentMethod && (
        <div className="flex items-center gap-2 text-xs text-text-secondary mb-1.5">
          <CreditCard size={12} className="flex-shrink-0" />
          <span>{PAYMENT_METHOD_LABELS[inv.paymentMethod]}</span>
          {inv.paidAt && <span className="text-text-muted">— {formatDate(inv.paidAt)}</span>}
        </div>
      )}

      {Number(inv.discount) > 0 && (
        <div className="text-xs text-text-muted mt-1">
          خصم: {formatCurrency(Number(inv.discount))} |
          الإجمالي: {formatCurrency(Number(inv.total))}
        </div>
      )}

      {inv.paymentStatus === 'pending' && onMarkPaid && (
        <PermissionGate permission="payment:update">
          <button
            onClick={() => onMarkPaid(inv.id)}
            className="w-full mt-3 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-success text-white rounded-lg hover:opacity-90 transition"
          >
            <CheckCircle size={13} /> تسجيل الدفع
          </button>
        </PermissionGate>
      )}
    </div>
  );
}
