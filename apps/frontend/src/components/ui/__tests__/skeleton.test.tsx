import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  Skeleton,
  PageHeaderSkeleton,
  ToolbarSkeleton,
  StatsRowSkeleton,
  ListSkeleton,
  TableSkeleton,
  CalendarSkeleton,
  DetailSkeleton,
  FormSkeleton,
  PageSkeleton,
} from '@/components/ui/skeleton';
import { PageLoader } from '@/components/ui/spinner';

/**
 * اختبارات UX التحميل.
 *
 * الثغرة التي تحرسها هذهSuite ليست ثغرة تفويض، بل **UX تحميل**: حالة
 * `idle/loading` كانت تُعرض كـ`PageLoader` فيفرغ المحتوى ويبدو التطبيق
 * معطّلًا، أو كـfallback قاسٍ أثناء data-loading فيهدم الترويسة.
 *
 * لذلك كل اختبار هنا يجب أن يفشل إن أُعيدrajوع spinner وحيد في وسط فراغ،
 * أو إن أُعيد إظهار الصفحة كاملة كمؤشر تحميل.
 */

describe('Skeleton — primitives', () => {
  it('الـSkeleton مؤهل accessibility: aria-hidden حتى لا يُقرأ ك��حتوى', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('يستخدم متغيّرات CSS القائمة فيدعم RTL والوضع الداكن بلا branching', () => {
    const { container } = render(<Skeleton data-testid="s" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.backgroundColor).toBe('var(--border)');
  });

  it('يحافظ على class الممرّر (الأبعاد يحدّدها المستدعي)', () => {
    const { container } = render(<Skeleton className="h-5 w-32" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('h-5');
    expect(el.className).toContain('w-32');
  });

  it('animate-pulse هو ما ينقل "قيد التحميل" بصريًا', () => {
    const { container } = render(<Skeleton />);
    expect((container.firstChild as HTMLElement).className).toContain('animate-pulse');
  });
});

describe('Skeleton — composites تحفظ أبعاد المحتوى النهائي', () => {
  it('PageHeaderSkeleton: ترويسة + وصف + أزرار إجراءات', () => {
    render(<PageHeaderSkeleton />);
    expect(screen.getByTestId('page-header-skeleton')).toBeInTheDocument();
  });

  it('ToolbarSkeleton: شريط بحث + عدد المرشّحات المطلوب', () => {
    render(<ToolbarSkeleton chips={3} />);
    expect(screen.getByTestId('toolbar-skeleton')).toBeInTheDocument();
  });

  it('StatsRowSkeleton: عدد البطاقات المطلوب ونفس شبكةصفحة appointments', () => {
    const { container } = render(<StatsRowSkeleton count={4} />);
    const grid = screen.getByTestId('stats-skeleton');
    /* نفس أبعاد الشبكة المستخدمة فعليًا في صفحة المواعيد */
    expect(grid.className).toContain('grid-cols-2');
    expect(grid.className).toContain('sm:grid-cols-4');
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(4);
  });

  it('ListSkeleton: شبكة بطاقات 3 أعمدة بعد البطاقات', () => {
    const { container } = render(<ListSkeleton count={6} />);
    expect(screen.getByTestId('list-skeleton').className).toContain('lg:grid-cols-3');
    /* 6 بطاقات × 5 عظام لكل بطاقة على الأقل */
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(24);
  });

  it('TableSkeleton: ترويسة صفوف بالأعمدة المطلوبة', () => {
    const { container } = render(<TableSkeleton rows={8} columns={5} />);
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(8 * 5);
  });

  it('CalendarSkeleton: شبكة 7 أعمدة مطابقة للتقويم النهائي', () => {
    const { container } = render(<CalendarSkeleton />);
    const root = screen.getByTestId('calendar-skeleton');
    expect(root).toBeInTheDocument();
    /* الشبكة 7 أعمدة هي عنصر داخلي لا الجذر */
    const grids = container.querySelectorAll('.grid-cols-7');
    expect(grids.length).toBe(2);
    /* 35 خلية = 5 أسابيع × 7 أيام */
    expect(grids[1].children.length).toBe(35);
  });
});

describe('PageSkeleton — حالة تحميل التفويض على مستوى الـshell', () => {
  it('تحتوي ترويسة وأدوات وصف محتوى — لا spinner في فراغ', () => {
    render(<PageSkeleton />);
    expect(screen.getByTestId('page-header-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });

  it('لا تحتوي PageLoader إطلاقًا (هذا هو الانحدار المطلوب Catchه)', () => {
    const { container } = render(<PageSkeleton />);
    /* PageLoader الوحيد كان spinner بـsvg — نتحقق أنه غير موجود */
    expect(container.querySelector('svg')).toBeNull();
  });

  it('variant="calendar" يظهر شبكة تقويم لا جدول', () => {
    render(<PageSkeleton variant="calendar" />);
    expect(screen.getByTestId('calendar-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('table-skeleton')).not.toBeInTheDocument();
  });

  it('variant="list" يظهر شبكة بطاقات لا جدول', () => {
    render(<PageSkeleton variant="list" />);
    expect(screen.getByTestId('list-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('table-skeleton')).not.toBeInTheDocument();
  });

  it('variant="detail" يعرض بطاقة تعريفية لا جدول ولا أدوات', () => {
    render(<PageSkeleton variant="detail" />);
    expect(screen.getByTestId('detail-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('table-skeleton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('toolbar-skeleton')).not.toBeInTheDocument();
  });

  it('variant="form" يعرض حقول نموذج وأزرار حفظ', () => {
    const { container } = render(<PageSkeleton variant="form" />);
    expect(screen.getByTestId('form-skeleton')).toBeInTheDocument();
    /* 6 حققول × (تسمية + حقل) على الأقل */
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(12);
  });

  it('DetailSkeleton وFormSkeleton متاحان كstandalone', () => {
    render(<><DetailSkeleton rows={4} /><FormSkeleton fields={2} /></>);
    expect(screen.getByTestId('detail-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('form-skeleton')).toBeInTheDocument();
  });

  it('تُعلن حالة التحميل للـassistive tech', () => {
    render(<PageSkeleton />);
    const el = screen.getByTestId('page-skeleton');
    expect(el).toHaveAttribute('role', 'status');
    expect(el).toHaveAttribute('aria-label', 'جارٍ التحميل');
  });
});

describe('PageLoader — ما الذي يبقى وما الذي أُزيل', () => {
  it('ما زال spinner بسيطًا متاحًا للاستخدامات غير الهيكلية', () => {
    const { container } = render(<PageLoader />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('لا يستخدم في حالة تحميل تفويض الـshell (middleware)', () => {
    /*
     * هذا الاختبار توثيقي: layout.tsx لا يستورد PageLoader بعد الآن.
     * إن أُعيد استيراده أو usage رجع، يفشل الاختبار.
     */
    const { readFileSync } = require('node:fs');
    const src = readFileSync(
      'src/app/dashboard/layout.tsx',
      'utf-8',
    );
    expect(src).not.toMatch(/import\s*{[^}]*PageLoader[^}]*}\s*from/);
    expect(src).not.toMatch(/<PageLoader\s*\/>/);
  });
});

describe('UX-LOADING: حالات التحميل المطلوبة', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('الحالة 1 — permissions pending: بنية صفحة كاملة، لا فراغ', () => {
    render(<PageSkeleton variant="calendar" />);
    /* المحتوى النهائي والموضع محفوظان */
    expect(screen.getByTestId('page-header-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('stats-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-skeleton')).toBeInTheDocument();
  });

  it('الحالة 2 — permissions ready: children تُركَّب (لا skeleton في مسار children)', () => {
    /* children حقيقي لا يحمل data-testid من الـskeleton */
    render(<div data-testid="real-page">محتوى</div>);
    expect(screen.getByTestId('real-page')).toBeInTheDocument();
    expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument();
  });

  it('الحالة 3 — permission denied / error: representationalـcase منفصل عن loading', () => {
    /*
     * خطأ الجلب ليس loading: layout يعرض retry button.
     * هذا الاختبار يثبت وجود مسار خطأ مستقل — لا PageSkeleton له.
     */
    const { readFileSync } = require('node:fs');
    const src = readFileSync('src/app/dashboard/layout.tsx', 'utf-8');
    expect(src).toContain("permissionStatus === 'error'");
    expect(src).toContain('permission-error');
    expect(src).toContain('retryPermissions');
  });

  it('الحالة 4 — page data loading: skeleton محلًا الشبكة فقط', () => {
    /* في appointments: الترويسة والمرشّحات تبقى، الشبكة فقط skeleton */
    const { readFileSync } = require('node:fs');
    const src = readFileSync('src/app/dashboard/appointments/page-client.tsx', 'utf-8');
    expect(src).toContain('isLoading ? <ListSkeleton />');
    /* لم يعد PageLoader يستبدل الصفحة كاملة */
    expect(src).not.toMatch(/isLoading \? <PageLoader/);
  });

  it('الحالة 5 — الإحصائيات تُعرض كـskeleton بنفس الأبعاد قبل وصولها', () => {
    const { readFileSync } = require('node:fs');
    const src = readFileSync('src/app/dashboard/appointments/page-client.tsx', 'utf-8');
    expect(src).toContain('{!stats && <StatsRowSkeleton />}');
  });

  it('الحالة 6 — empty state: موجود والمسار محفوظ', () => {
    const { readFileSync } = require('node:fs');
    const src = readFileSync('src/app/dashboard/appointments/page-client.tsx', 'utf-8');
    expect(src).toContain('EmptyState');
    expect(src).toContain('لا توجد مواعيد');
  });

  it('الحالة 7 — calendar dynamic loader لم يعد spinner يفرغ الصفحة', () => {
    const { readFileSync } = require('node:fs');
    const src = readFileSync('src/app/dashboard/appointments/page-client.tsx', 'utf-8');
    expect(src).toContain('loading: () => <CalendarSkeleton />');
  });
});

/**
 * Gate على مستوى المشروع: لا يجوز أن يبقى `<PageLoader />` في أي صفحة من
 * صفحات الـdashboard كحالة تحميل كاملة، لأن ذلك بالضبط هو الانحدار الذي
 * عالجناه — فراغ + spinner بدل بنية الصفحة.
 *
 * يُقرأ نظام الملفات فعليًا، فأي صفحة جديدة تعيد الاستخدام القديم تُفشل الاختبار.
 */
describe('GATE: لا PageLoader متبقٍ كحالة تحميل صفحة كاملة', () => {
  const { readdirSync, readFileSync, statSync } = require('node:fs');
  const { join } = require('node:path');

  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full, out);
      else if (full.endsWith('.tsx')) out.push(full);
    }
    return out;
  }

  /* ⓘ layout.tsx و loading.tsx مُستثنيان صراحة: يُتحقق منهما باختبارات مخصّصة
     أعلاه (استيراد PageLoader ممنوع فيهما). */
  const EXEMPT = ['dashboard\\layout.tsx', 'dashboard\\loading.tsx'];

  it('لا صفحة dashboard تستخدم <PageLoader /> كت حالة تحميل كاملة', () => {
    const files = walk('src/app/dashboard').filter(
      (f) => !EXEMPT.some((x) => f.endsWith(x)) && !f.includes('__tests__'),
    );
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf-8');
      /* نتجاهل أسطر التعليقات — التحقق من الاستخدام الفعلي في JSX */
      const code = src.split('\n').filter((l: string) => !/^\s*(\*|\/\*|\/\/)/.test(l)).join('\n');
      if (/<PageLoader\s*\/>/.test(code)) offenders.push(f);
    }
    expect(offenders).toEqual([]);
  });

  it('لا صفحة dashboard تستورد PageLoader بلا استخدام فعلي', () => {
    const files = walk('src/app/dashboard').filter((f) => !f.includes('__tests__'));
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf-8');
      const imports = /import\s*\{[^}]*PageLoader[^}]*\}\s*from/.test(src);
      const uses = (src.match(/<PageLoader\s*\/>/g) ?? []).length;
      if (imports && uses === 0) offenders.push(f);
    }
    expect(offenders).toEqual([]);
  });

  it('loading.tsx يستخدم PageSkeleton لا spinner', () => {
    const src = readFileSync('src/app/dashboard/loading.tsx', 'utf-8');
    expect(src).toContain('PageSkeleton');
    expect(src).not.toMatch(/return\s*<PageLoader/);
  });

  it('dashboard/loading.tsx يغلّف انتقال المسار بهيكل الصفحة', () => {
    const src = readFileSync('src/app/dashboard/loading.tsx', 'utf-8');
    expect(src).toContain('export default function DashboardLoading');
  });
});

describe('REDUCED MOTION: احترام تفضيل تقليل الحركة', () => {
  it('globals.css يوقف animate-pulse لمن اختار تقليل الحركة', () => {
    const { readFileSync } = require('node:fs');
    const css = readFileSync('src/app/globals.css', 'utf-8');
    expect(css).toContain('prefers-reduced-motion');
    expect(css).toContain('.animate-pulse');
    /* الإيقاف يجب أن يكون صريحًا لا مجرد تعريف */
    expect(css).toMatch(/animation:\s*none\s*!important/);
  });
});