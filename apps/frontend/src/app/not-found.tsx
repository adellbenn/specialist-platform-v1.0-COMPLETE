import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="text-center max-w-sm">
        <p className="text-h1 font-semibold text-primary mb-2">404</p>
        <h1 className="text-h2 font-semibold text-text-primary mb-2">
          الصفحة غير موجودة
        </h1>
        <p className="text-body text-text-secondary mb-8">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى عنوان آخر.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2 text-small font-medium text-white rounded-lg transition-all duration-150 bg-primary hover:bg-primary-hover shadow-xs hover:shadow-sm"
        >
          العودة للوحة التحكم
        </Link>
      </div>
    </div>
  );
}
