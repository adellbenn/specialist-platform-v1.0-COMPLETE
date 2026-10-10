import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MustChangePasswordGuard } from '../must-change-password.guard';
import { AuthController } from '@modules/auth/auth.controller';
import { TwoFactorController } from '@modules/auth/two-factor/two-factor.controller';
import { BeneficiariesController } from '@modules/beneficiaries/beneficiaries.controller';

const flaggedUser = (overrides: any = {}) => ({
  id: 'user-1',
  role: 'specialist',
  mustChangePassword: true,
  ...overrides,
});

const clearUser = (overrides: any = {}) => ({
  id: 'user-1',
  role: 'specialist',
  mustChangePassword: false,
  ...overrides,
});

function buildContext(user: any, handler: any, cls: any): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => cls,
    switchToHttp: () => ({
      getRequest: () => ({ user, method: 'GET', path: '/api/v1/beneficiaries' }),
    }),
  } as unknown as ExecutionContext;
}

describe('MustChangePasswordGuard', () => {
  let guard: MustChangePasswordGuard;

  beforeEach(() => {
    guard = new MustChangePasswordGuard(new Reflector());
  });

  const run = (user: any, handler: any, cls: any) =>
    guard.canActivate(buildContext(user, handler, cls));

  const beneficiariesFindAll = BeneficiariesController.prototype.findAll;

  describe('flagged user (mustChangePassword = true)', () => {
    it('blocks GET /beneficiaries with 403 MUST_CHANGE_PASSWORD', () => {
      let thrown: any;
      try {
        run(flaggedUser(), beneficiariesFindAll, BeneficiariesController);
      } catch (err) {
        thrown = err;
      }

      expect(thrown).toBeInstanceOf(ForbiddenException);
      expect(thrown.getStatus()).toBe(403);
      expect(thrown.getResponse()).toMatchObject({ message: 'MUST_CHANGE_PASSWORD' });
    });

    it('does not exempt super_admin', () => {
      expect(() =>
        run(flaggedUser({ role: 'super_admin' }), beneficiariesFindAll, BeneficiariesController),
      ).toThrow(ForbiddenException);
    });

    it('allows PATCH /auth/change-password', () => {
      expect(
        run(flaggedUser(), AuthController.prototype.changePassword, AuthController),
      ).toBe(true);
    });

    it('allows GET /auth/me', () => {
      expect(run(flaggedUser(), AuthController.prototype.getProfile, AuthController)).toBe(true);
    });

    it('allows POST /auth/logout', () => {
      expect(run(flaggedUser(), AuthController.prototype.logout, AuthController)).toBe(true);
    });

    it('allows POST /auth/refresh', () => {
      expect(run(flaggedUser(), AuthController.prototype.refreshToken, AuthController)).toBe(true);
    });

    it('allows the 2FA routes', () => {
      const routes: Array<[Function, Function]> = [
        [TwoFactorController.prototype.generate, TwoFactorController],
        [TwoFactorController.prototype.verifyAndEnable, TwoFactorController],
        [TwoFactorController.prototype.disable, TwoFactorController],
        [TwoFactorController.prototype.status, TwoFactorController],
      ];

      for (const [handler, cls] of routes) {
        expect(run(flaggedUser(), handler, cls)).toBe(true);
      }
    });

    it('allows public routes (@Public)', () => {
      expect(run(flaggedUser(), AuthController.prototype.login, AuthController)).toBe(true);
    });
  });

  describe('unflagged user', () => {
    it('is unaffected on a normally blocked route', () => {
      expect(run(clearUser(), beneficiariesFindAll, BeneficiariesController)).toBe(true);
    });

    it('allows when mustChangePassword is undefined', () => {
      expect(
        run({ id: 'user-1', role: 'specialist' }, beneficiariesFindAll, BeneficiariesController),
      ).toBe(true);
    });

    it('allows when there is no user on the request', () => {
      expect(run(undefined, beneficiariesFindAll, BeneficiariesController)).toBe(true);
    });
  });

  describe('after a successful change-password', () => {
    it('the same user (flag cleared) is allowed on GET /beneficiaries', () => {
      // changePassword persists mustChangePassword=false and invalidates the
      // cached user, so JwtStrategy reloads the fresh flag on the next request.
      expect(run(clearUser(), beneficiariesFindAll, BeneficiariesController)).toBe(true);
    });
  });
});
