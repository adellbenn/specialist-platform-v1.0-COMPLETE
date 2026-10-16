/**
 * منطق شريط التنقّل السفلي للجوال (خالص وقابل للاختبار).
 *
 * الشريط يعرض **أول 4 مسارات مسموحة للدور** من نفس قائمة التنقّل المُفلترة،
 * فلا يمكن أن يظهر فيه مسار لا يستطيع المستخدم فتحه (المصدر واحد).
 * العنصر الخامس ثابت: «المزيد» يفتح درج التنقّل القائم.
 */
export const BOTTOM_NAV_LIMIT = 4;

/**
 * مسارات ذات تذييل ثابت (sticky form footer) — يُخفى الشريط السفلي لتفادي
 * تعارضه مع التذييل. لا توجد حالياً صفحات بهذا الشكل، والقائمة ملحق صريح
 * قابل للتوسّع دون تغيير السلوك الحالي.
 */
export const STICKY_FOOTER_ROUTES: readonly string[] = [];

const AUTH_PREFIX = '/auth';

/** يُخفى الشريط على صفحات المصادقة وصفحات النماذج ذات التذييل الثابت. */
export function isBottomNavHidden(pathname: string): boolean {
  if (pathname.startsWith(AUTH_PREFIX)) return true;
  return STICKY_FOOTER_ROUTES.some((prefix) => pathname.startsWith(prefix));
}
