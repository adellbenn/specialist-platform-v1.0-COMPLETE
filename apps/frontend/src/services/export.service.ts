'use client';

import { Beneficiary, BeneficiaryFile, Appointment, Invoice } from '@/types';
import { toDateKey } from '@/lib/utils';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function exportToCSV(
  data: object[],
  filename: string,
  headers: Record<string, string>,
): void {
  if (!data.length) return;

  const keys   = Object.keys(headers);
  const labels = Object.values(headers);

  const csvRows = [
    labels.join(','),
    ...data.map((row) =>
      keys.map((k) => {
        const val = (row as Record<string, unknown>)[k] ?? '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') ? `"${str}"` : str;
      }).join(','),
    ),
  ];

  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });

  downloadBlob(blob, `${filename}.csv`);
}

export function exportTableToPDF(
  title:    string,
  headers:  string[],
  rows:     string[][],
  filename: string,
): void {
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(title)}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
        h1 { font-size: 18px; margin-bottom: 16px; color: #1f2937; }
        .meta { font-size: 12px; color: #6b7280; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #4f46e5; color: white; padding: 8px 12px; text-align: right; }
        td { padding: 7px 12px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) td { background: #f9fafb; }
        @media print {
          body { padding: 10px; }
          @page { margin: 1cm; }
        }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      <p class="meta">تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <table>
        <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </body>
    </html>
  `;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.print(); }, 300);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download  = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportBeneficiaries(data: Beneficiary[]): void {
  exportToCSV(data, `مستفيدون-${today()}`, {
    fileNumber:  'رقم الملف',
    firstName:   'الاسم الأول',
    lastName:    'اسم العائلة',
    caseType:    'نوع الحالة',
    status:      'الحالة',
    phone:       'الجوال',
    intakeDate:  'تاريخ التسجيل',
  });
}

export function exportAppointments(data: Appointment[]): void {
  const rows: Record<string, unknown>[] = data.map((a) => ({
    'beneficiary.firstName': a.beneficiary?.firstName ?? '',
    'specialist.firstName':  a.specialist?.firstName ?? '',
    scheduledAt:             a.scheduledAt,
    type:                    a.type,
    status:                  a.status,
    durationMinutes:         a.durationMinutes,
  }));
  exportToCSV(rows, `مواعيد-${today()}`, {
    'beneficiary.firstName': 'اسم المستفيد',
    'specialist.firstName':  'الأخصائي',
    scheduledAt:             'التاريخ والوقت',
    type:                    'النوع',
    status:                  'الحالة',
    durationMinutes:         'المدة (دقيقة)',
  });
}

export function exportInvoices(data: Invoice[]): void {
  const rows: Record<string, unknown>[] = data.map((inv) => ({
    invoiceNumber:           inv.invoiceNumber,
    'beneficiary.firstName': inv.beneficiary?.firstName ?? '',
    amount:                  inv.amount,
    discount:                inv.discount,
    total:                   inv.total,
    paymentStatus:           inv.paymentStatus,
    paymentMethod:           inv.paymentMethod ?? '',
    paidAt:                  inv.paidAt ?? '',
  }));
  exportToCSV(rows, `فواتير-${today()}`, {
    invoiceNumber:           'رقم الفاتورة',
    'beneficiary.firstName': 'اسم المستفيد',
    amount:                  'المبلغ',
    discount:                'الخصم',
    total:                   'الإجمالي',
    paymentStatus:           'حالة الدفع',
    paymentMethod:           'طريقة الدفع',
    paidAt:                  'تاريخ الدفع',
  });
}

export function exportBeneficiaryReport(beneficiary: Beneficiary, file: BeneficiaryFile | null): void {
  const rows: string[][] = [
    ['الاسم الكامل',       `${beneficiary.firstName} ${beneficiary.lastName}`],
    ['رقم الملف',          beneficiary.fileNumber],
    ['نوع الحالة',         beneficiary.caseType],
    ['الحالة',             beneficiary.status],
    ['تاريخ التسجيل',      beneficiary.intakeDate],
    ['الأخصائي المسؤول',   beneficiary.assignedSpecialist
      ? `${beneficiary.assignedSpecialist.firstName} ${beneficiary.assignedSpecialist.lastName}`
      : '—'],
    ['التاريخ الطبي',       file?.medicalHistory ?? '—'],
    ['التاريخ التربوي',     file?.educationalHistory ?? '—'],
    ['التاريخ الأسري',      file?.familyHistory ?? '—'],
  ];

  exportTableToPDF(
    `تقرير مستفيد: ${beneficiary.firstName} ${beneficiary.lastName}`,
    ['البيان', 'التفاصيل'],
    rows,
    `تقرير-${beneficiary.fileNumber}`,
  );
}

function today(): string {
  return toDateKey(new Date());
}
