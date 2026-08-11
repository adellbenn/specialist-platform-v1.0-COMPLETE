import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
  applyDecorators,
  UseGuards,
} from '@nestjs/common';
import { UserRole, ADMIN_CLASS_ROLES, WRITER_CLASS_ROLES } from '@modules/users/user.entity';
import { Permission } from '@common/permissions/permissions.enum';
import { RolesGuard } from '@common/guards/roles.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RbacGuard } from '@common/guards/rbac.guard';
import { ROLES_KEY, PERMISSIONS_KEY, SKIP_RBAC_KEY } from './keys';

// Re-export metadata keys and simple decorators so
// `import { Public, IS_PUBLIC_KEY } from '@common/decorators'` still works
export { IS_PUBLIC_KEY, ROLES_KEY, PERMISSIONS_KEY, SKIP_RBAC_KEY, Public } from './keys';

// ═══════════════════════════════════════════════════════════════
// BASIC DECORATORS
// ═══════════════════════════════════════════════════════════════

/** تجاوز RbacGuard لمسار محدد */
export const SkipRbac = () => SetMetadata(SKIP_RBAC_KEY, true);

/** تحديد الأدوار المسموح بها */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// ═══════════════════════════════════════════════════════════════
// PERMISSION DECORATOR
// ═══════════════════════════════════════════════════════════════

/**
 * @RequirePermissions — يتحقق من صلاحيات دقيقة
 *
 * @example
 * @RequirePermissions(Permission.BENEFICIARY_CREATE)
 * async createBeneficiary() {}
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  applyDecorators(SetMetadata(PERMISSIONS_KEY, permissions), UseGuards(PermissionGuard));

// ═══════════════════════════════════════════════════════════════
// ROLE-BASED COMPOSITE DECORATORS
// ═══════════════════════════════════════════════════════════════

/**
 * @AdminOnly — أدوار الإدارة فقط (قراءة)
 * super_admin, center_manager, supervisor, accountant
 */
export const AdminOnly = () => applyDecorators(UseGuards(RolesGuard), Roles(...ADMIN_CLASS_ROLES));

/**
 * @WriterOnly — أدوار الكتابة فقط
 * specialist, receptionist
 */
export const WriterOnly = () =>
  applyDecorators(UseGuards(RolesGuard), Roles(...WRITER_CLASS_ROLES));

/**
 * @AllStaff — جميع موظفي المركز (بدون المستفيدين)
 */
export const AllStaff = () =>
  applyDecorators(UseGuards(RolesGuard), Roles(...ADMIN_CLASS_ROLES, ...WRITER_CLASS_ROLES));

/**
 * @AllRoles — جميع الأدوار بما فيهم المستفيد
 */
export const AllRoles = () =>
  applyDecorators(
    UseGuards(RolesGuard),
    Roles(...ADMIN_CLASS_ROLES, ...WRITER_CLASS_ROLES, UserRole.BENEFICIARY),
  );

/**
 * @StaffOrBeneficiary — alias for @AllRoles
 * الموظفون + المستفيد لمساراتهم المشتركة
 */
export const StaffOrBeneficiary = AllRoles;

// ═══════════════════════════════════════════════════════════════
// PARAM DECORATORS
// ═══════════════════════════════════════════════════════════════

/** استخراج المستخدم الحالي */
export const CurrentUser = createParamDecorator((data: keyof any, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  return data ? user?.[data] : user;
});

/** استخراج tenantId */
export const TenantId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.tenantId || request.user?.tenantId;
});

/** استخراج beneficiaryId للمستخدم المستفيد */
export const BeneficiaryId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.beneficiaryId ?? null;
  },
);
