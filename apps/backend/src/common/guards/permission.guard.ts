import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '@common/decorators/keys';
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

    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    const result = await this.engine.authorizeAll(user, required);

    if (!result.allowed) {
      throw new ForbiddenException(
        `لا تملك الصلاحية الكافية. الصلاحيات المطلوبة: ${result.missing.join(', ')}`,
      );
    }

    return true;
  }
}
