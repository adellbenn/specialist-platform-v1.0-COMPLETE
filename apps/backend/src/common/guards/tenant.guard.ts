import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@modules/users/user.entity';

/**
 * يضمن أن المستخدم يصل فقط لبيانات مركزه
 * Super Admin مستثنى — يصل لكل المراكز
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Super Admin يملك وصولاً كاملاً
    if (user.role === UserRole.SUPER_ADMIN) return true;

    // التحقق من وجود tenant_id للمستخدم
    if (!user.tenantId) {
      throw new ForbiddenException('المستخدم غير مرتبط بأي مركز');
    }

    // حقن tenantId في الـ request لاستخدامه في الـ services
    request.tenantId = user.tenantId;

    return true;
  }
}
