/**
 * تسميات الأدوار — مصدر واحد لكل الواجهة.
 *
 * الأدوار النظامية تُخزَّن في قاعدة البيانات بمفتاحها الإنجليزي (مثل `super_admin`)،
 * وتُعرض بالعربية عبر `getRoleLabel`. أي دور مخصّص ليس في الخريطة يُعاد اسمه
 * المخزَّن كما هو دون تغيير.
 */
export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'المدير العام',
  center_manager: 'مدير المركز',
  supervisor: 'مشرف',
  specialist: 'أخصائي',
  receptionist: 'موظف الاستقبال',
  accountant: 'محاسب',
  beneficiary: 'مستفيد',
};

/**
 * يعيد التسمية العربية لمفتاح دور معروف، وإلا يعيد النص كما هو
 * (للدور المخصّص) أو نصًا فارغًا عند غياب القيمة.
 */
export function getRoleLabel(keyOrName?: string | null): string {
  if (!keyOrName) return '';
  return ROLE_LABELS[keyOrName] ?? keyOrName;
}
