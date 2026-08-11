jest.mock('../metrics.module', () => {
  const observe = jest.fn();
  const inc = jest.fn();
  return {
    httpRequestDuration: { labels: jest.fn(() => ({ observe })) },
    httpRequestTotal: { labels: jest.fn(() => ({ inc })) },
    httpErrorsTotal: { labels: jest.fn(() => ({ inc })) },
  };
});

import { of } from 'rxjs';
import { HttpMetricsInterceptor } from '../http-metrics.interceptor';
import { httpRequestDuration, httpRequestTotal, httpErrorsTotal } from '../metrics.module';

function mockContextAndHandler(opts: { statusCode?: number; routePath?: string; url?: string } = {}) {
  const req: any = {
    method: 'GET',
    route: { path: opts.routePath || '/api/v1/test' },
    url: opts.url || '/api/v1/test',
  };
  const res: any = {
    statusCode: opts.statusCode ?? 200,
  };
  const context = {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  };
  const next = {
    handle: () => of('body'),
  };
  return { context, next, req, res };
}

describe('HttpMetricsInterceptor', () => {
  let interceptor: HttpMetricsInterceptor;

  beforeEach(() => {
    jest.clearAllMocks();
    interceptor = new HttpMetricsInterceptor();
  });

  it('records duration and total metrics for 2xx', (done) => {
    const { context, next } = mockContextAndHandler({ statusCode: 200 });
    interceptor.intercept(context as any, next as any).subscribe(() => {
      expect(httpRequestDuration.labels).toHaveBeenCalledWith('GET', '/api/v1/test', '200');
      expect(httpRequestTotal.labels).toHaveBeenCalled();
      done();
    });
  });

  it('records error metrics for 4xx', (done) => {
    const { context, next } = mockContextAndHandler({ statusCode: 404 });
    interceptor.intercept(context as any, next as any).subscribe(() => {
      expect(httpErrorsTotal.labels).toHaveBeenCalled();
      done();
    });
  });

  it('records error metrics for 5xx', (done) => {
    const { context, next } = mockContextAndHandler({ statusCode: 500 });
    interceptor.intercept(context as any, next as any).subscribe(() => {
      expect(httpErrorsTotal.labels).toHaveBeenCalled();
      done();
    });
  });

  it('uses req.url when no route', (done) => {
    const { context, next } = mockContextAndHandler({ routePath: undefined });
    interceptor.intercept(context as any, next as any).subscribe(() => {
      expect(httpRequestDuration.labels).toHaveBeenCalledWith(
        'GET',
        '/api/v1/test',
        '200',
      );
      done();
    });
  });
});
