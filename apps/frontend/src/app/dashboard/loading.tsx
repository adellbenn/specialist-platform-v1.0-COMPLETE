import { PageSkeleton } from '@/components/ui/skeleton';

/**
 * DashboardLoading — غلاف Suspense على مستوى كل مسارات /dashboard.
 *
 * كان `<PageLoader />`: spinner وحيد يظهر أثناء انتقال المسار، فيبدو التطبيق
 * معطّلًا لثوانٍ رغم أن التنقل يعمل. الآن يُعرض هيكل الصفحة نفسه، فالتنقل
 * يبدو كاستمرارية بصرية بدل قفزة إلى فراغ.
 *
 * الشكل الافتراضي `table` لأنه الأكثر شيوعًا بين صفحات الـdashboard؛ الصفحات
 * ذات الشكل المختلف تُ LOADING الخاصة بها عند الحاجة.
 */
export default function DashboardLoading() {
  return <PageSkeleton />;
}