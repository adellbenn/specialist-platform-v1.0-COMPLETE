import { describe, it, expect } from 'vitest';
import {
  cn,
  truncate,
  getInitials,
  buildQueryString,
  toDateKey,
  isoToDateKey,
} from '@/lib/utils';

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
