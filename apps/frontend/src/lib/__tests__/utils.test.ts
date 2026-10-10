import { describe, it, expect } from 'vitest';
import {
  cn,
  truncate,
  getInitials,
  buildQueryString,
  toDateKey,
  isoToDateKey,
  formatDate,
  formatDateTime,
  formatNumber,
  formatCurrency,
  timeAgo,
  APP_LOCALE,
  APP_CURRENCY,
} from '@/lib/utils';

const ARABIC_INDIC = /[\u0660-\u0669\u06F0-\u06F9]/;

describe('cn', () => {
  it('يدمج الأصناف ويزيل التعارضات', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('a', 'b')).toBe('a b');
  });
});

describe('truncate', () => {
  it('يختصر النص الطويل بنقاط', () => {
    expect(truncate('abcdefghij', 5)).toBe('abcde...');
  });

  it('يُبقي النص القصير كما هو', () => {
    expect(truncate('abc', 5)).toBe('abc');
  });
});

describe('getInitials', () => {
  it('يُرجع الحرفين الأولين', () => {
    expect(getInitials('أحمد', 'محمد')).toBe('أم');
  });
});

describe('buildQueryString', () => {
  it('يبني query string مع تجاهل القيم الفارغة', () => {
    expect(buildQueryString({ page: 1, q: '', limit: 10 })).toBe('?page=1&limit=10');
  });

  it('يرمّز القيم الخاصة', () => {
    expect(buildQueryString({ q: 'a b' })).toBe('?q=a%20b');
  });

  it('يعيد سلسلة فارغة عند عدم وجود قيم', () => {
    expect(buildQueryString({ a: undefined, b: '' })).toBe('');
  });
});

describe('toDateKey / isoToDateKey', () => {
  it('يحوّل Date إلى مفتاح محلي YYYY-MM-DD', () => {
    const d = new Date(2024, 5, 3); // 3 يونيو 2024
    expect(toDateKey(d)).toBe('2024-06-03');
  });

  it('يحوّل ISO إلى مفتاح اليوم المحلي', () => {
    expect(isoToDateKey('2024-06-03T10:00:00.000Z')).toMatch(/^2024-06-0[0-9]$/);
  });
});

describe('ثوابت اللغة والعملة', () => {
  it('يُثبّت لغة التطبيق والعملة الافتراضية', () => {
    expect(APP_LOCALE).toBe('ar-DZ');
    expect(APP_CURRENCY).toBe('DZD');
  });
});

describe('formatNumber', () => {
  it('يُخرج أرقامًا لاتينية بلا أرقام عربية-هندية', () => {
    const out = formatNumber(1234.5);
    expect(out).toMatch(/[0-9]/);
    expect(out).not.toMatch(ARABIC_INDIC);
  });
});

describe('formatDate / formatDateTime', () => {
  it('يُخرجان أرقامًا لاتينية', () => {
    expect(formatDate('2026-10-10T12:00:00Z')).toMatch(/[0-9]/);
    expect(formatDate('2026-10-10T12:00:00Z')).not.toMatch(ARABIC_INDIC);
    expect(formatDateTime('2026-10-10T12:00:00Z')).toMatch(/[0-9]/);
    expect(formatDateTime('2026-10-10T12:00:00Z')).not.toMatch(ARABIC_INDIC);
  });
});

describe('formatCurrency', () => {
  it('يعرض العملة "دج" بأرقام لاتينية وبلا رمز الدولار', () => {
    const out = formatCurrency(1234.5);
    expect(out).toContain('دج');
    expect(out).not.toContain('$');
    expect(out).not.toContain('د.ج.');
    expect(out).toMatch(/[0-9]/);
    expect(out).not.toMatch(ARABIC_INDIC);
  });

  it('يستخدم DZD افتراضيًا ويسمح بتمرير عملة أخرى', () => {
    expect(formatCurrency(100)).toContain('دج');
    expect(formatCurrency(100, 'EUR')).toContain('EUR');
  });
});

describe('timeAgo', () => {
  it('يستخدم أرقامًا لاتينية', () => {
    const out = timeAgo(new Date(Date.now() - 5 * 60 * 1000).toISOString());
    expect(out).toContain('5');
    expect(out).not.toMatch(ARABIC_INDIC);
  });

  it('يُرجع "منذ لحظات" للأحدث من دقيقة', () => {
    expect(timeAgo(new Date(Date.now() - 5 * 1000).toISOString())).toBe('منذ لحظات');
  });
});
