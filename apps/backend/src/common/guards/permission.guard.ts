import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, PERMISSIONS_ANY_KEY } from '@common/decorators/keys';
import { PermissionEngine } from '@common/permissions/permission-engine.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private engine: PermissionEngine,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredAny = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_ANY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const hasAll = !!required && required.length > 0;
    const hasAny = !!requiredAny && requiredAny.length > 0;

    if (!hasAll && !hasAny) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    if (hasAll) {
      const result = await this.engine.authorizeAll(user, required);
      if (!result.allowed) {
        throw new ForbiddenException(
          `لا تملك الصلاحية الكافية. الصلاحيات المطلوبة: ${result.missing.join(', ')}`,
        );
      }
    }

    if (hasAny) {
      const result = await this.engine.authorizeAny(user, requiredAny);
      if (!result.allowed) {
        throw new ForbiddenException(
          `لا تملك الصلاحية الكافية. الصلاحيات المطلوبة (واحدة على الأقل): ${requiredAny.join(', ')}`,
        );
      }
    }

    return true;
  }
}
