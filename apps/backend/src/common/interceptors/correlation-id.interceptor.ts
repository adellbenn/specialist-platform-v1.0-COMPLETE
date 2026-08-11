import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const incoming = req.headers['x-request-id'];
    const id = Array.isArray(incoming) ? incoming[0] : incoming || uuidv4();

    req.correlationId = id;
    res.setHeader('X-Request-ID', id);

    const start = Date.now();
    const { method, url } = req;

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        res.setHeader('X-Response-Time', `${ms}ms`);

        const msg = `[${id}] ${method} ${url} ${res.statusCode} ${ms}ms`;
        if (res.statusCode >= 500) {
          this.logger.error(msg);
        } else if (res.statusCode >= 400) {
          this.logger.warn(msg);
        } else {
          this.logger.log(msg);
        }
      }),
    );
  }
}
