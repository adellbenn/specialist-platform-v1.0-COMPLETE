import { of } from 'rxjs';
import { CorrelationIdInterceptor } from '../correlation-id.interceptor';

jest.mock('uuid', () => ({ v4: () => 'mock-uuid-123' }));

function mockContextAndHandler(opts: { requestId?: string; statusCode?: number } = {}) {
  const req: any = {
    headers: {},
    method: 'GET',
    url: '/api/v1/test',
  };
  if (opts.requestId) req.headers['x-request-id'] = opts.requestId;

  const res: any = {
    setHeader: jest.fn(),
    statusCode: opts.statusCode ?? 200,
  };

  const context = {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  };

  const next = {
    handle: () => of('response-body'),
  };

  return { context, req, res, next };
}

describe('CorrelationIdInterceptor', () => {
  let interceptor: CorrelationIdInterceptor;

  beforeEach(() => {
    interceptor = new CorrelationIdInterceptor();
  });

  it('uses x-request-id header when present', () => {
    const { context, req, res, next } = mockContextAndHandler({ requestId: 'incoming-id' });
    interceptor.intercept(context as any, next as any).subscribe();
    expect(req.correlationId).toBe('incoming-id');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', 'incoming-id');
  });

  it('generates UUID when no x-request-id header', () => {
    const { context, req, res, next } = mockContextAndHandler({});
    interceptor.intercept(context as any, next as any).subscribe();
    expect(req.correlationId).toBe('mock-uuid-123');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', 'mock-uuid-123');
  });

  it('takes first element when x-request-id is an array', () => {
    const { context, req, res, next } = mockContextAndHandler({});
    (req.headers as any)['x-request-id'] = ['id-first', 'id-second'];
    interceptor.intercept(context as any, next as any).subscribe();
    expect(req.correlationId).toBe('id-first');
  });

  it('sets X-Response-Time header on completion', (done) => {
    const { context, res, next } = mockContextAndHandler({ statusCode: 200 });
    interceptor.intercept(context as any, next as any).subscribe(() => {
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Response-Time',
        expect.stringMatching(/^\d+ms$/),
      );
      done();
    });
  });

  it('logs for 2xx status', (done) => {
    const { context, next } = mockContextAndHandler({ statusCode: 200 });
    const spy = jest.spyOn((interceptor as any).logger, 'log');
    interceptor.intercept(context as any, next as any).subscribe(() => {
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
      done();
    });
  });

  it('logs warn for 4xx status', (done) => {
    const { context, res, next } = mockContextAndHandler({ statusCode: 404 });
    res.statusCode = 404;
    const spy = jest.spyOn((interceptor as any).logger, 'warn');
    interceptor.intercept(context as any, next as any).subscribe(() => {
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
      done();
    });
  });

  it('logs error for 5xx status', (done) => {
    const { context, res, next } = mockContextAndHandler({ statusCode: 500 });
    res.statusCode = 500;
    const spy = jest.spyOn((interceptor as any).logger, 'error');
    interceptor.intercept(context as any, next as any).subscribe(() => {
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
      done();
    });
  });
});
