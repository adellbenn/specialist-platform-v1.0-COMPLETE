import { describe, it, expect } from 'vitest';

import { useAuthStore } from '@/store/auth.store';

/**
 * عطل الجذر: مُثبّت `onRehydrateStorage` كان يشير إلى `useAuthStore` أثناء
 * بنائه فيحدث `ReferenceError` يبتلعه `hydrate()` صامتًا، فتبقى `_hydrated=false`
 * إلى الأبد ويُخرج `dashboard/layout.tsx` قبل استدعاء `fetchPermissions()`.
 * هذا الاختبار يفشل لو عاد العطل، لأنه لا يضبط `_hydrated` يدويًا أبدًا.
 */
describe('hydration الفعلي لمخزن المصادقة', () => {
  it('persist.hasHydrated() و _hydrated تصلان إلى true بعمل persist نفسه', async () => {
    expect(useAuthStore.persist.hasHydrated()).toBe(true);
    expect(useAuthStore.getState()._hydrated).toBe(true);

    await Promise.resolve();
    await Promise.resolve();

    expect(useAuthStore.getState()._hydrated).toBe(true);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
