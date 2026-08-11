import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: Record<string, any>;
  correlationId?: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const req = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((response) => {
        if (response && typeof response === 'object' && 'data' in response) {
          return {
            success: true,
            ...response,
            correlationId: req.correlationId,
          };
        }

        return {
          success: true,
          data: response,
          correlationId: req.correlationId,
        };
      }),
    );
  }
}
