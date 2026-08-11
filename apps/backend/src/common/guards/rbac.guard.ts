import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getRbacClass, RbacClass, WRITE_BYPASS_ROLES } from '@modules/users/user.entity';
import { SKIP_RBAC_KEY } from '@common/decorators/keys';

/** HTTP Methods التي تُعدّ عمليات كتابة */
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * RbacGuard — الحماية على مستوى HTTP Method
 *
 *  ADMIN_CLASS  → GET فقط
 *  WRITER_CLASS → كل شيء
 *  BENEFICIARY  → محدود بـ PermissionGuard حسب كل endpoint
 */
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skipRbac = this.reflector.getAllAndOverride<boolean>(SKIP_RBAC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipRbac) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return true;

    const method = request.method as string;
    const rbacClass = getRbacClass(user.role);

    // أدوار التجاوز (super_admin, center_manager) — مسموح لهم بالكتابة
    if (WRITE_BYPASS_ROLES.includes(user.role)) {
      return true;
    }

    // المدير (ADMIN_CLASS) — GET فقط
    if (rbacClass === RbacClass.ADMIN && WRITE_METHODS.has(method)) {
      throw new ForbiddenException(
        'صلاحيات المدير للمراقبة والعرض فقط — لا يمكن إجراء عمليات التعديل',
      );
    }

    // المستفيد — يمكنه PATCH على مساره الخاص فقط (profile)
    // بقية القيود يتولاها PermissionGuard
    if (rbacClass === RbacClass.BENEFICIARY && WRITE_METHODS.has(method)) {
      const path: string = request.path || '';
      const allowedWritePaths = ['/api/v1/beneficiaries/me', '/api/v1/auth/'];
      const isAllowed = allowedWritePaths.some((p) => path.startsWith(p));
      if (!isAllowed) {
        throw new ForbiddenException('المستفيد لا يملك صلاحية هذه العملية');
      }
    }

    return true;
  }
}
