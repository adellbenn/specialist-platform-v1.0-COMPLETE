import { describe, it, expect } from 'vitest';
import {
  getAuditActionLabel,
  getActorLabel,
  getAuditEntityLabel,
} from '@/lib/audit-labels';

describe('getAuditActionLabel: تسميات عمليات سجل الأمان', () => {
  it('يعيد التسمية العربية لكل عملية معروفة', () => {
    expect(getAuditActionLabel('LOGIN')).toBe('تسجيل دخول');
    expect(getAuditActionLabel('LOGOUT')).toBe('تسجيل خروج');
    expect(getAuditActionLabel('CREATE')).toBe('إنشاء');
    expect(getAuditActionLabel('UPDATE')).toBe('تعديل');
    expect(getAuditActionLabel('DELETE')).toBe('حذف/أرشفة');
  });

  it('يعيد العملية كما هي عند غيابها من الخريطة', () => {
    expect(getAuditActionLabel('READ')).toBe('READ');
    expect(getAuditActionLabel('EXPORT')).toBe('EXPORT');
    expect(getAuditActionLabel('APPROVE')).toBe('APPROVE');
    expect(getAuditActionLabel('SUBMIT')).toBe('SUBMIT');
  });

  it('يعيد نصًا فارغًا عند غياب القيمة', () => {
    expect(getAuditActionLabel()).toBe('');
    expect(getAuditActionLabel(null)).toBe('');
    expect(getAuditActionLabel('')).toBe('');
  });
});

describe('getActorLabel: اسم الفاعل أو بريده', () => {
  it('يعيد الاسم الأول والأخير', () => {
    expect(getActorLabel({ firstName: 'أحمد', lastName: 'بن علي' })).toBe('أحمد بن علي');
  });

  it('يعود إلى البريد عند غياب الاسم', () => {
    expect(getActorLabel({ email: 'user@example.com' })).toBe('user@example.com');
  });

  it('يعيد "النظام" عند غياب الفاعل', () => {
    expect(getActorLabel(null)).toBe('النظام');
    expect(getActorLabel()).toBe('النظام');
    expect(getActorLabel({})).toBe('النظام');
  });
});

describe('getAuditEntityLabel: تسميات الكيانات', () => {
  it('يوحّد اختلاف حالة الأحرف', () => {
    expect(getAuditEntityLabel('Auth')).toBe('مصادقة');
    expect(getAuditEntityLabel('auth')).toBe('مصادقة');
    expect(getAuditEntityLabel('Role')).toBe('دور');
    expect(getAuditEntityLabel('PermissionGroup')).toBe('مجموعة صلاحيات');
    expect(getAuditEntityLabel('UserPermission')).toBe('صلاحية مستخدم');
  });

  it('يعيد القيمة الأصلية لنوع كيان غير معروف', () => {
    expect(getAuditEntityLabel('CustomThing')).toBe('CustomThing');
  });

  it('يعيد نصًا فارغًا عند غياب القيمة', () => {
    expect(getAuditEntityLabel()).toBe('');
    expect(getAuditEntityLabel(null)).toBe('');
    expect(getAuditEntityLabel('')).toBe('');
  });
});
