'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * RBAC USAGE EXAMPLES
 * أمثلة استخدام نظام الصلاحيات لكل دور
 * ═══════════════════════════════════════════════════════════════
 *
 * هذا الملف للتوثيق والمرجعية فقط — لا يُستخدم مباشرة في الإنتاج
 */

import { PermissionGate } from '@/components/auth/permission-gate';
import { withPermission, useRouteGuard } from '@/components/auth/route-guard';
import { usePermissions } from '@/hooks/use-permissions';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// مثال 1: صفحة المستفيدين — تتصرف بشكل مختلف لكل دور
// ═══════════════════════════════════════════════════════════════
export function BeneficiariesPageExample() {
  const { can, isAdmin, isSpecialist, isBeneficiary } = usePermissions();

  return (
    <div>
      {/* زر إضافة — يظهر للأخصائي فقط */}
      <PermissionGate permission="beneficiary:create">
        <button className="btn-primary flex gap-2 items-center">
          <Plus size={16} /> مستفيد جديد
        </button>
      </PermissionGate>

      {/* المدير يرى شارة "للمراقبة فقط" */}
      {isAdmin && (
        <div className="bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
          <Eye size={14} /> أنت في وضع المراقبة — عرض فقط
        </div>
      )}

      {/* المستفيد يرى ملفه فقط */}
      {isBeneficiary && (
        <div className="bg-primary-light text-primary px-3 py-2 rounded-lg text-sm">
          تعرض هذه الصفحة ملفك الشخصي فقط
        </div>
      )}

      {/* أزرار الإجراءات في بطاقة المستفيد */}
      <div className="flex gap-2">
        {/* الجميع يرى */}
        <button><Eye size={16} /></button>

        {/* الأخصائي فقط يعدّل */}
        <PermissionGate permission="beneficiary:update">
          <button><Edit size={16} /></button>
        </PermissionGate>

        {/* الأخصائي فقط يؤرشف */}
        <PermissionGate permission="beneficiary:archive">
          <button><Trash2 size={16} /></button>
        </PermissionGate>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// مثال 2: صفحة التقارير — موافقة للمشرف، عرض للمدير، إنشاء للأخصائي
// ═══════════════════════════════════════════════════════════════
export function ReportsPageExample() {
  return (
    <div>
      {/* إنشاء تقرير — أخصائي فقط */}
      <PermissionGate permission="report:create">
        <button>+ تقرير جديد</button>
      </PermissionGate>

      {/* موافقة — مشرف وأعلى */}
      <PermissionGate permission="report:approve">
        <button>موافقة على التقرير</button>
      </PermissionGate>

      {/* تصدير — إدارة فقط */}
      <PermissionGate permission="report:export">
        <button>تصدير PDF</button>
      </PermissionGate>

      {/* المستفيد يرى تقاريره المشاركة فقط */}
      <PermissionGate permission="report:view_shared">
        <div>التقارير المشاركة معي</div>
      </PermissionGate>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// مثال 3: useRouteGuard — حماية صفحات كاملة
// ═══════════════════════════════════════════════════════════════
export function UsersManagementPage() {
  // إعادة التوجيه تلقائياً إن لم يملك الصلاحية
  useRouteGuard({ permission: 'user:view', redirectTo: '/dashboard' });

  return <div>إدارة المستخدمين</div>;
}

// ═══════════════════════════════════════════════════════════════
// مثال 4: withPermission HOC — صفحة الإعدادات
// ═══════════════════════════════════════════════════════════════
function SettingsPageInner() {
  return <div>إعدادات النظام</div>;
}

export const SettingsPage = withPermission(SettingsPageInner, {
  anyRole: ['super_admin', 'center_manager'],
  redirectTo: '/dashboard',
});

// ═══════════════════════════════════════════════════════════════
// مثال 5: usePermissions مباشرة في منطق الكود
// ═══════════════════════════════════════════════════════════════
export function AppointmentActions({ appointmentId }: { appointmentId: string }) {
  const { can, isBeneficiary } = usePermissions();

  const handleConfirm = async () => {
    if (!can('appointment:confirm')) return;
    // ... تأكيد الموعد
  };

  return (
    <div>
      {/* الأخصائي يؤكد الحضور */}
      {can('appointment:confirm') && (
        <button onClick={handleConfirm}>تأكيد الحضور</button>
      )}

      {/* المستفيد يرى موعده بدون أزرار تعديل */}
      {isBeneficiary && (
        <div>موعدك: {appointmentId}</div>
      )}
    </div>
  );
}
