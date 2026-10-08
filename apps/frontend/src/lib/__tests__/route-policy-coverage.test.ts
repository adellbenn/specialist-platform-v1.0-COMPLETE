import { describe, it, expect } from 'vitest';
import { getRoutePolicy } from '@/lib/route-policy';
import { readdirSync, statSync } from 'node:fs';
import { relative, join, sep } from 'node:path';

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith('page.tsx')) out.push(full);
  }
  return out;
}

/** يحوّل مسار ملف page.tsx إلى مسار URL كما في Next.js app router. */
function routeOf(file: string, base: string): string {
  const rel = relative(base, file).split(sep).join('/').replace(/(^|\/)page\.tsx$/, '');
  return '/dashboard' + (rel === '' ? '' : '/' + rel);
}

describe('تغطية policy: كل صفحة داخل /dashboard مُدرجة', () => {
  const base = join(process.cwd(), 'src', 'app', 'dashboard');
  const routes = walk(base).map((f) => routeOf(f, base));

  it('لا توجد صفحة بلا سياسة — الفشل الآمن يبقيها محمية افتراضياً', () => {
    const unlisted = routes.filter((r) => getRoutePolicy(r) === null).sort();
    expect(unlisted).toEqual([]);
  });

  it('كل سياسة فيها دور واحد على الأقل أو صلاحية واحدة', () => {
    const empty = routes.filter((r) => {
      const p = getRoutePolicy(r);
      if (!p) return false;
      const hasRole = Boolean(p.role) || Boolean(p.anyRole?.length);
      return !hasRole && !p.permission && !p.anyPermission?.length;
    });
    expect(empty).toEqual([]);
  });

  it('كل سياسة لها وجهة تحويل (لا حلقات تحويل على /dashboard نفسه)', () => {
    const noRedirect = routes.filter((r) => {
      const p = getRoutePolicy(r);
      return p && (!p.redirectTo || p.redirectTo === r);
    });
    expect(noRedirect).toEqual([]);
  });

  it('صفحة الفرع الديناميكي لكل قائمة مُدرجة صراحة', () => {
    const withDetail = routes.filter((r) => /\/\[id\]$/.test(r));
    expect(withDetail.length).toBeGreaterThan(0);
    expect(withDetail.filter((r) => getRoutePolicy(r) === null)).toEqual([]);
  });

  it('الاختبار يمشي على نظام الملفات: صفحة جديدة بدون-policy تكسره', () => {
    /* قراءة العدد من القرص لا من قائمة ثابتة */
    expect(routes.length).toBeGreaterThan(40);
  });
});