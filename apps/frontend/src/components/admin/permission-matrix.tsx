'use client';

import { useState } from 'react';
import { Check, X, ChevronDown, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PermissionItem {
  id: string;
  module: string;
  action: string;
  displayName?: string;
}

interface PermissionMatrixProps {
  grouped: Record<string, PermissionItem[]>;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleModule: (module: string, permissionIds: string[]) => void;
  viewMode?: 'matrix' | 'list';
  compact?: boolean;
}

const ACTION_LABELS: Record<string, string> = {
  view: 'عرض',
  view_all: 'عرض الكل',
  view_own: 'عرض الخاص',
  view_self: 'عرض الذات',
  view_shared: 'عرض المشارك',
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  archive: 'أرشفة',
  restore: 'استعادة',
  import: 'استيراد',
  export: 'تصدير',
  approve: 'اعتماد',
  assign: 'تعيين',
  cancel: 'إلغاء',
  print: 'طباعة',
  share: 'مشاركة',
  manage: 'إدارة',
  confirm: 'تأكيد',
  deactivate: 'تعطيل',
  stats: 'إحصائيات',
  performance: 'أداء',
  upload: 'رفع',
  refund: 'استرداد',
  compare: 'مقارنة',
  override: 'تجاوز',
  audit: 'تدقيق',
  send: 'إرسال',
};

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'لوحة التحكم',
  beneficiaries: 'المستفيدون',
  appointments: 'المواعيد',
  sessions: 'الجلسات',
  specialists: 'الأخصائيون',
  medical_records: 'السجلات الطبية',
  files: 'الملفات',
  reports: 'التقارير',
  payments: 'المدفوعات',
  invoices: 'الفواتير',
  users: 'المستخدمون',
  roles: 'الأدوار',
  permissions: 'الصلاحيات',
  settings: 'الإعدادات',
  notifications: 'الإشعارات',
  analytics: 'الإحصائيات',
  audit: 'التدقيق',
  tenant: 'المركز',
  profile: 'الملف الشخصي',
};

export function PermissionMatrix({
  grouped,
  selectedIds,
  onToggle,
  onToggleModule,
  viewMode = 'matrix',
  compact = false,
}: PermissionMatrixProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const modules = Object.keys(grouped).sort();

  const allActions = [
    ...new Set(Object.values(grouped).flatMap((perms) => perms.map((p) => p.action))),
  ];

  const toggleExpand = (module: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  };

  if (compact) {
    return (
      <div className="space-y-1">
        {modules.map((module) => {
          const perms = grouped[module];
          const modulePermIds = perms.map((p) => p.id);
          const allSelected = modulePermIds.every((id) => selectedIds.has(id));
          const someSelected = modulePermIds.some((id) => selectedIds.has(id));

          return (
            <div key={module}
              className="rounded-lg transition-all"
              style={{ border: '1px solid var(--border)' }}>
              <button
                onClick={() => toggleExpand(module)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium"
                style={{ color: 'var(--text-primary)' }}>
                <div className="flex items-center gap-2">
                  {expanded.has(module)
                    ? <ChevronDown size={12} />
                    : <ChevronLeft size={12} />}
                  <span>{MODULE_LABELS[module] || module}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {modulePermIds.filter((id) => selectedIds.has(id)).length}/{modulePermIds.length}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleModule(module, modulePermIds); }}
                    className="text-[11px] px-2 py-0.5 rounded transition"
                    style={{
                      backgroundColor: allSelected ? 'var(--primary)' : 'var(--surface)',
                      color: allSelected ? 'white' : 'var(--text-muted)',
                    }}>
                    {allSelected ? 'كلها' : someSelected ? 'بعضها' : 'اختيار'}
                  </button>
                </div>
              </button>
              {expanded.has(module) && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                  {perms.map((perm) => (
                    <button
                      key={perm.id}
                      onClick={() => onToggle(perm.id)}
                      className="text-[11px] px-2 py-1 rounded-md transition flex items-center gap-1"
                      style={{
                        backgroundColor: selectedIds.has(perm.id)
                          ? 'var(--primary)'
                          : 'var(--surface)',
                        color: selectedIds.has(perm.id) ? 'white' : 'var(--text-secondary)',
                      }}>
                      {selectedIds.has(perm.id) ? <Check size={10} /> : null}
                      {ACTION_LABELS[perm.action] || perm.action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {modules.map((module) => {
          const perms = grouped[module];
          return (
            <div key={module} className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--border)' }}>
              <button onClick={() => toggleExpand(module)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>
                <span>{MODULE_LABELS[module] || module}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{perms.length}</span>
              </button>
              {expanded.has(module) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 p-3">
                  {perms.map((perm) => (
                    <div key={perm.id} className="text-xs px-2.5 py-1.5 rounded-lg"
                      style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}>
                      {perm.displayName || perm.action}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ backgroundColor: 'var(--surface)' }}>
            <th className="text-right p-3 font-semibold min-w-[160px]" style={{ color: 'var(--text-primary)' }}>الوحدة</th>
            {allActions.map((action) => (
              <th key={action} className="text-center p-2 font-medium min-w-[64px]" style={{ color: 'var(--text-muted)' }}>
                {ACTION_LABELS[action] || action}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {modules.map((module) => {
            const moduleActionSet = new Set(grouped[module].map((p) => p.action));
            return (
              <tr key={module} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="p-3 font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {MODULE_LABELS[module] || module}
                </td>
                {allActions.map((action) => (
                  <td key={action} className="text-center p-2">
                    {moduleActionSet.has(action) ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded"
                        style={{ backgroundColor: 'var(--success-light)' }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--success)' }} />
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
