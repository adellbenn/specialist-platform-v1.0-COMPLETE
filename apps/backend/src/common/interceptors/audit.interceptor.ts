import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PATH_METADATA, HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditLogService } from '@modules/audit-log/audit-log.module';
import { AuditAction } from '@modules/audit-log/audit-log.entity';
import { IS_PUBLIC_KEY } from '@common/decorators';

interface AuditRecord {
  userId?: string;
  tenantId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  description?: string;
}

type AuditRequest = Request & { user?: any; tenantId?: string };

/**
 * AuditInterceptor — يسجّل عمليات الكتابة الناجحة وأحداث المصادقة.
 *
 * - POST/PUT/PATCH/DELETE الناجحة → CREATE/UPDATE/DELETE
 * - login (نجاح/فشل), logout, تغيير كلمة المرور → LOGIN/LOGOUT/UPDATE
 * - يتم تخطي المسارات العامة (غير أحداث المصادقة) و health/metrics
 * - لا يتم تخزين جسم الطلب أو الاستجابة إطلاقاً (لا كلمات مرور/توكنات/بيانات شخصية)
 * - فشل التسجيل لا يُفشل الطلب أبداً (fire-and-forget + try/catch)
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private static readonly WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  private static readonly LOGIN_HANDLERS = new Set(['login', 'loginTwoFactor']);
  private static readonly LOGOUT_HANDLERS = new Set(['logout', 'logoutAll']);
  private static readonly PASSWORD_HANDLERS = new Set(['changePassword', 'resetPassword']);
  private static readonly SKIP_CONTROLLERS = new Set(['health', 'metrics']);

  constructor(
    private readonly auditLog: AuditLogService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<AuditRequest>();
    const method = `${req.method || ''}`.toUpperCase();
    const controllerPath = this.getControllerPath(context);

    if (AuditInterceptor.SKIP_CONTROLLERS.has(controllerPath)) {
      return next.handle();
    }

    const authAction = this.resolveAuthAction(context.getHandler?.()?.name);
    const isWrite = AuditInterceptor.WRITE_METHODS.has(method);

    if (!isWrite && !authAction) {
      return next.handle();
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic && !authAction) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (data) =>
          this.safeLog(this.buildRecord(context, req, method, controllerPath, authAction, data, null)),
        error: (err) => {
          // Only login failures are logged — other failed writes are ignored.
          if (authAction === AuditAction.LOGIN) {
            this.safeLog(this.buildRecord(context, req, method, controllerPath, authAction, null, err));
          }
        },
      }),
    );
  }

  private safeLog(record: AuditRecord): void {
    try {
      void this.auditLog.log(record).catch(() => undefined);
    } catch {
      // Never let a logging failure break the request.
    }
  }

  private buildRecord(
    context: ExecutionContext,
    req: AuditRequest,
    method: string,
    controllerPath: string,
    authAction: AuditAction | null,
    data: any,
    err: any,
  ): AuditRecord {
    const actor = this.resolveActor(req, data);
    const status = err ? this.errorStatus(err) : this.successStatus(context, method);
    const route = this.routePattern(req);
    const outcome = authAction === AuditAction.LOGIN ? (err ? 'failure' : 'success') : null;

    const description = [
      method,
      route,
      `status=${status}`,
      `role=${actor.role ?? 'unknown'}`,
      outcome ? `outcome=${outcome}` : null,
    ]
      .filter(Boolean)
      .join(' ');

    return {
      userId: actor.userId,
      tenantId: actor.tenantId,
      action: authAction ?? this.writeAction(method),
      entityType: authAction ? 'Auth' : controllerPath || 'unknown',
      entityId: this.resolveEntityId(req, data) ?? (authAction ? actor.userId : undefined),
      ipAddress: this.clientIp(req),
      description,
    };
  }

  private resolveAuthAction(handlerName?: string): AuditAction | null {
    if (!handlerName) return null;
    if (AuditInterceptor.LOGIN_HANDLERS.has(handlerName)) return AuditAction.LOGIN;
    if (AuditInterceptor.LOGOUT_HANDLERS.has(handlerName)) return AuditAction.LOGOUT;
    if (AuditInterceptor.PASSWORD_HANDLERS.has(handlerName)) return AuditAction.UPDATE;
    return null;
  }

  private writeAction(method: string): AuditAction {
    switch (method) {
      case 'POST':
        return AuditAction.CREATE;
      case 'DELETE':
        return AuditAction.DELETE;
      default:
        return AuditAction.UPDATE;
    }
  }

  private getControllerPath(context: ExecutionContext): string {
    const path = this.reflector.get<string>(PATH_METADATA, context.getClass()) || '';
    return path.replace(/^\/+|\/+$/g, '');
  }

  private resolveActor(req: AuditRequest, data: any) {
    const user = req.user || {};
    const payload = data && typeof data === 'object' ? (data.data ?? data) : null;
    const responseUser =
      payload && typeof payload === 'object' && payload.user ? payload.user : null;

    return {
      userId: user.id || responseUser?.id,
      role: user.role || responseUser?.role,
      tenantId: user.tenantId || req.tenantId || responseUser?.tenantId,
    };
  }

  private resolveEntityId(req: AuditRequest, data: any): string | undefined {
    const params = (req.params || {}) as Record<string, any>;
    if (params.id) return String(params.id);
    for (const key of Object.keys(params)) {
      if (key !== 'id' && /id$/i.test(key) && params[key]) return String(params[key]);
    }

    const payload = data && typeof data === 'object' ? (data.data ?? data) : null;
    if (payload && typeof payload === 'object') {
      if (payload.id) return String(payload.id);
      if (payload.user?.id) return String(payload.user.id);
    }
    return undefined;
  }

  private routePattern(req: AuditRequest): string {
    const base = (req as any).baseUrl || '';
    const path = (req as any).route?.path || req.path || req.url || '';
    return `${base}${path}` || req.originalUrl || '';
  }

  private successStatus(context: ExecutionContext, method: string): number {
    const code = this.reflector.get<number>(HTTP_CODE_METADATA, context.getHandler());
    if (typeof code === 'number') return code;
    return method === 'POST' ? 201 : 200;
  }

  private errorStatus(err: any): number {
    const status =
      typeof err?.getStatus === 'function' ? err.getStatus() : (err?.status ?? err?.statusCode);
    return typeof status === 'number' ? status : 500;
  }

  private clientIp(req: AuditRequest): string | undefined {
    const forwarded = req.headers?.['x-forwarded-for'];
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const ip = first ? String(first).split(',')[0].trim() : req.ip;
    return ip || undefined;
  }
}
