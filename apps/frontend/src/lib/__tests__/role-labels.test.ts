import { describe, it, expect } from 'vitest';
import { getRoleLabel } from '@/lib/role-labels';

describe('getRoleLabel: تسميات الأدوار العربية', () => {
  it('يعيد التسمية العربية لكل دور نظامي معروف', () => {
    expect(getRoleLabel('super_admin')).toBe('المدير العام');
    expect(getRoleLabel('center_manager')).toBe('مدير المركز');
    expect(getRoleLabel('supervisor')).toBe('مشرف');
    expect(getRoleLabel('specialist')).toBe('أخصائي');
    expect(getRoleLabel('receptionist')).toBe('موظف الاستقبال');
    expect(getRoleLabel('accountant')).toBe('محاسب');
    expect(getRoleLabel('beneficiary')).toBe('مستفيد');
  });

  it('يعيد الاسم المخزّن كما هو لدور مخصّص غير موجود في الخريطة', () => {
    expect(getRoleLabel('مشرف أول')).toBe('مشرف أول');
    expect(getRoleLabel('custom_role')).toBe('custom_role');
  });

  it('يعيد نصًا فارغًا عند غياب القيمة', () => {
    expect(getRoleLabel()).toBe('');
    expect(getRoleLabel(null)).toBe('');
    expect(getRoleLabel('')).toBe('');
  });
});
