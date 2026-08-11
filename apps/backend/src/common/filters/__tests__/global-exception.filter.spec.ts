import { HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from '../global-exception.filter';

function mockHost(exception: unknown, opts: { correlationId?: string; method?: string; url?: string } = {}) {
  const req = {
    correlationId: 'correlationId' in opts ? opts.correlationId : 'corr-123',
    method: opts.method || 'GET',
    url: opts.url || '/api/v1/test',
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as any;
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
  });

  it('handles unknown exception with 500 status', () => {
    const host = mockHost(new Error('boom'));
    filter.catch(new Error('boom'), host);
    const res = host.switchToHttp().getResponse();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 500,
        message: 'حدث خطأ داخلي في الخادم',
        correlationId: 'corr-123',
      }),
    );
  });

  it('handles HttpException with string response', () => {
    const ex = new HttpException('Not found', HttpStatus.NOT_FOUND);
    const host = mockHost(ex);
    filter.catch(ex, host);
    const res = host.switchToHttp().getResponse();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Not found',
        errors: null,
      }),
    );
  });

  it('handles HttpException with object response containing string message', () => {
    const ex = new HttpException({ message: 'Bad request' }, HttpStatus.BAD_REQUEST);
    const host = mockHost(ex);
    filter.catch(ex, host);
    const res = host.switchToHttp().getResponse();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Bad request',
        errors: null,
      }),
    );
  });

  it('handles HttpException with array message → errors field + Arabic message', () => {
    const ex = new HttpException(
      { message: ['field1 is required', 'field2 is invalid'] },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    const host = mockHost(ex);
    filter.catch(ex, host);
    const res = host.switchToHttp().getResponse();
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'بيانات غير صحيحة',
        errors: ['field1 is required', 'field2 is invalid'],
      }),
    );
  });

  it('uses "unknown" when correlationId is not set on request', () => {
    const host = mockHost(new Error('oops'), { correlationId: undefined });
    filter.catch(new Error('oops'), host);
    const res = host.switchToHttp().getResponse();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: 'unknown' }),
    );
  });

  it('logs error with stack for 5xx exceptions', () => {
    const spy = jest.spyOn((filter as any).logger, 'error');
    const ex = new Error('server error');
    ex.stack = 'Error: server error\n    at line 1';
    const host = mockHost(ex);
    filter.catch(ex, host);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toContain('corr-123');
    spy.mockRestore();
  });

  it('logs warn for 4xx exceptions', () => {
    const spy = jest.spyOn((filter as any).logger, 'warn');
    const ex = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    const host = mockHost(ex);
    filter.catch(ex, host);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('includes path and timestamp in response', () => {
    const host = mockHost(new Error('x'), { url: '/api/v1/users' });
    filter.catch(new Error('x'), host);
    const res = host.switchToHttp().getResponse();
    const body = res.json.mock.calls[0][0];
    expect(body.path).toBe('/api/v1/users');
    expect(body.timestamp).toBeDefined();
  });
});
