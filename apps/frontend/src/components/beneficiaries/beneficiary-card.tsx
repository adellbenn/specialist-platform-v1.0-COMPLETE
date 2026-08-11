'use client';

import Link from 'next/link';
import { User, Phone, Calendar, ChevronLeft } from 'lucide-react';
import { Beneficiary, CASE_TYPE_LABELS, CASE_TYPE_COLORS, STATUS_LABELS, STATUS_COLORS, GENDER_LABELS } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface BeneficiaryCardProps {
  beneficiary: Beneficiary;
}

export function BeneficiaryCard({ beneficiary: b }: BeneficiaryCardProps) {
  return (
    <Link href={`/dashboard/beneficiaries/${b.id}`}>
      <div className="bg-background rounded-xl border border-border p-4 hover:shadow-md hover:border-primary/40 transition-all group cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">
                {b.firstName[0]}{b.lastName[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-text-primary truncate">
                {b.firstName} {b.lastName}
              </p>
              <p className="text-xs text-text-muted font-mono">{b.fileNumber}</p>
            </div>
          </div>
          <ChevronLeft size={16} className="text-text-muted group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge label={CASE_TYPE_LABELS[b.caseType]} className={CASE_TYPE_COLORS[b.caseType]} />
          <Badge label={STATUS_LABELS[b.status]} className={STATUS_COLORS[b.status]} dot />
          {b.gender && (
            <Badge label={GENDER_LABELS[b.gender]} className="bg-surface-secondary text-text-secondary" />
          )}
        </div>

        <div className="mt-3 space-y-1">
          {b.phone && (
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Phone size={12} />
              <span dir="ltr">{b.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Calendar size={12} />
            <span>تاريخ التسجيل: {formatDate(b.intakeDate)}</span>
          </div>
          {b.assignedSpecialist && (
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <User size={12} />
              <span>{b.assignedSpecialist.firstName} {b.assignedSpecialist.lastName}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
