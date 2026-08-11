import { JwtAuthGuard } from '../jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@common/decorators/keys';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new JwtAuthGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow public routes', () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should delegate to passport for non-public routes', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    // Mock super.canActivate to prevent actual JWT validation
    const superCanActivate = jest.fn().mockReturnValue(true);
    jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate').mockImplementation(superCanActivate);

    const handler = () => {};
    const clazz = class {};
    const context = {
      getHandler: jest.fn().mockReturnValue(handler),
      getClass: jest.fn().mockReturnValue(clazz),
    } as any;

    guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      handler,
      clazz,
    ]);
  });

  describe('handleRequest', () => {
    it('should throw UnauthorizedException when no user', () => {
      expect(() => (guard as any).handleRequest(null, null)).toThrow('غير مصرح بالوصول');
    });

    it('should throw passed error', () => {
      const err = new Error('Custom error');
      expect(() => (guard as any).handleRequest(err, null)).toThrow('Custom error');
    });

    it('should return user when valid', () => {
      const user = { id: '1', role: 'super_admin' };
      expect((guard as any).handleRequest(null, user)).toBe(user);
    });
  });
});
