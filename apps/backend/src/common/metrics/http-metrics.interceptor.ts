import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import {
  httpRequestDuration,
  httpRequestTotal,
  httpErrorsTotal,
} from './metrics.module';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, route } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        const routePath = route?.path || req.url;

        httpRequestDuration
          .labels(method, routePath, String(statusCode))
          .observe(duration);

        httpRequestTotal
          .labels(method, routePath, String(statusCode))
          .inc();

        if (statusCode >= 400) {
          httpErrorsTotal
            .labels(method, routePath, String(statusCode))
            .inc();
        }
      }),
    );
  }
}
