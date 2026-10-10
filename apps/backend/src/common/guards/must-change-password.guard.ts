import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_MUST_CHANGE_PASSWORD_KEY, IS_PUBLIC_KEY } from '@common/decorators/keys';

/**
 * MustChangePasswordGuard
 *
 * يمنع كل المسارات عندما يكون `request.user.mustChangePassword === true`
 * باستجابة 403 برمز `MUST_CHANGE_PASSWORD`، ما عدا:
 *   - المسارات العامة (@Public)
 *   - المسارات المعلَّمة بـ @AllowWhenMustChangePassword()
 *     (تغيير كلمة المرور، /me، الخروج، refresh، ومسارات 2FA)
 *
 * يعيد استخدام المستخدم المحمَّل مسبقاً بواسطة JwtStrategy.validate
 * (كاش Redis أو استعلام قاعدة البيانات) — لا استعلام إضافي لكل طلب.
 * تغيير كلمة المرور يُبطل كاش المستخدم، لذا تُقرأ القيمة حديثة في الطلب التالي
 * (super_admin غير مستثنى).
 */
@Injectable()
export class MustChangePasswordGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const allowed = this.reflector.getAllAndOverride<boolean>(ALLOW_MUST_CHANGE_PASSWORD_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowed) return true;

    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    if (user && user.mustChangePassword === true) {
      throw new ForbiddenException('MUST_CHANGE_PASSWORD');
    }

    return true;
  }
}
