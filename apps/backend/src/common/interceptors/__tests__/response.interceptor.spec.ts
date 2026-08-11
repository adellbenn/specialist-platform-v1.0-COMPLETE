import { of } from 'rxjs';
import { ResponseInterceptor } from '../response.interceptor';

function mockContextAndHandler(responseBody: any) {
  const req: any = {
    correlationId: 'corr-abc',
  };

  const context = {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  };

  const next = {
    handle: () => of(responseBody),
  };

  return { context, next, req };
}

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<any>;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  it('wraps raw response in { success, data, correlationId }', (done) => {
    const { context, next } = mockContextAndHandler({ name: 'test' });
    interceptor.intercept(context as any, next as any).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: { name: 'test' },
        correlationId: 'corr-abc',
      });
      done();
    });
  });

  it('merges response that already has a data property', (done) => {
    const { context, next } = mockContextAndHandler({
      data: { items: [1, 2] },
      meta: { total: 2 },
    });
    interceptor.intercept(context as any, next as any).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: { items: [1, 2] },
        meta: { total: 2 },
        correlationId: 'corr-abc',
      });
      done();
    });
  });

  it('wraps null response', (done) => {
    const { context, next } = mockContextAndHandler(null);
    interceptor.intercept(context as any, next as any).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: null,
        correlationId: 'corr-abc',
      });
      done();
    });
  });

  it('wraps string response', (done) => {
    const { context, next } = mockContextAndHandler('hello');
    interceptor.intercept(context as any, next as any).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: 'hello',
        correlationId: 'corr-abc',
      });
      done();
    });
  });

  it('wraps number response', (done) => {
    const { context, next } = mockContextAndHandler(42);
    interceptor.intercept(context as any, next as any).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: 42,
        correlationId: 'corr-abc',
      });
      done();
    });
  });

  it('preserves message field when already present in response', (done) => {
    const { context, next } = mockContextAndHandler({
      data: 'ok',
      message: 'Success',
    });
    interceptor.intercept(context as any, next as any).subscribe((result) => {
      expect(result.message).toBe('Success');
      done();
    });
  });
});
