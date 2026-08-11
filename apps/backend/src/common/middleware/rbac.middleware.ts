import { Injectable, NestMiddleware, ForbiddenException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getRbacClass, RbacClass, WRITE_BYPASS_ROLES } from '@modules/users/user.entity';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const EXEMPT_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/docs',
];

/** مسارات يُسمح فيها للمستفيد بالكتابة */
const BENEFICIARY_WRITE_PATHS = ['/api/v1/beneficiaries/me', '/api/v1/auth/'];

/**
 * RbacMiddleware — يطبّق قواعد RBAC على مستوى الطلب
 *
 * JWT already verified by JwtAuthGuard; this only sets rbacClass on the request.
 */
@Injectable()
export class RbacMiddleware implements NestMiddleware {
  private readonly logger = new Logger('RbacMiddleware');

  use(req: Request, res: Response, next: NextFunction): void {
    if (EXEMPT_PATHS.some((p) => req.path.startsWith(p))) return next();

    const user = (req as any).user;
    if (!user?.role) return next();

    const rbacClass = getRbacClass(user.role);
    (req as any).rbacClass = rbacClass;

    const method = req.method.toUpperCase();
    if (!WRITE_METHODS.has(method)) return next();

    if (WRITE_BYPASS_ROLES.includes(user.role)) {
      return next();
    }

    if (rbacClass === RbacClass.ADMIN) {
      this.logger.warn(`Admin write blocked | ${method} ${req.path}`);
      throw new ForbiddenException('صلاحيات المدير للمراقبة والعرض فقط');
    }

    if (rbacClass === RbacClass.BENEFICIARY) {
      const allowed = BENEFICIARY_WRITE_PATHS.some((p) => req.path.startsWith(p));
      if (!allowed) {
        this.logger.warn(`Beneficiary write blocked | ${method} ${req.path}`);
        throw new ForbiddenException('المستفيد لا يملك صلاحية هذه العملية');
      }
    }

    this.logger.log(`${user.role} | ${method} ${req.path}`);
    next();
  }
}
