import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const arFormatter = new Intl.DateTimeFormat('ar-SA', {
  day: '2-digit', month: '2-digit', year: 'numeric',
});
const arDateTimeFormatter = new Intl.DateTimeFormat('ar-SA', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: true,
});

export function formatDate(date: string | Date): string {
  return arFormatter.format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return arDateTimeFormatter.format(new Date(date));
}

export function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'منذ لحظات';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 30) return `منذ ${days} يوم`;
  if (months < 12) return `منذ ${months} شهر`;
  return `منذ ${years} سنة`;
}

/** تنسيق المبلغ المالي */
export function formatCurrency(amount: number, currency = 'SAR'): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

/** اختصار النص الطويل */
export function truncate(text: string, maxLength = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/** الحصول على الحروف الأولى للاسم (للأفاتار) */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] || ''}${lastName[0] || ''}`;
}

/** بناء query string من object */
export function buildQueryString(params: object): string {
  const filtered = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0))
    .map(([k, v]) => `${k}=${encodeURIComponent(Array.isArray(v) ? v.join(',') : String(v))}`);
  return filtered.length ? `?${filtered.join('&')}` : '';
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** مفتاح تاريخ محلي (YYYY-MM-DD) بدلاً من UTC لتفادي انزياح المناطق الزمنية */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** تحويل ISO timestamp إلى مفتاح اليوم المحلي */
export function isoToDateKey(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.split('T')[0];
  return toDateKey(d);
}
