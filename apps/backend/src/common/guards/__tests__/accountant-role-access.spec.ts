import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles.guard';
import { PERMISSIONS_KEY } from '@common/decorators/keys';
import { getPermissionsForRole } from '@common/permissions/role-permissions';
import { Permission } from '@common/permissions/permissions.enum';
import { UserRole } from '@modules/users/user.entity';
import { PaymentsController } from '@modules/payments/payments.controller';
import { ReportsController } from '@modules/reports/reports.controller';
import { NotificationsController } from '@modules/notifications/notifications.controller';
import { AnalyticsController } from '@modules/analytics/analytics.controller';
import { UsersController } from '@modules/users/users.controller';
import { TenantsController } from '@modules/tenants/tenants.controller';
import { SessionsController } from '@modules/sessions/sessions.controller';
import { FilesController } from '@modules/files/files.controller';
import { AppointmentsController } from '@modules/appointments/appointments.controller';
import { BeneficiariesController } from '@modules/beneficiaries/beneficiaries.controller';

describe('Accountant role access', () => {
  const guard = new RolesGuard(new Reflector());

  function context(handler: any, cls: any) {
    return {
      getHandler: () => handler,
      getClass: () => cls,
      switchToHttp: () => ({ getRequest: () => ({ user: { role: UserRole.ACCOUNTANT } }) }),
    } as any;
  }

  describe('RolesGuard allows accountant on its own module routes', () => {
    it.each([
      ['payments GET /payments/invoices', PaymentsController, PaymentsController.prototype.getInvoices],
      ['payments GET /payments/stats', PaymentsController, PaymentsController.prototype.getStats],
      ['payments POST /payments/invoices', PaymentsController, PaymentsController.prototype.createInvoice],
      ['reports GET /reports', ReportsController, ReportsController.prototype.findAll],
      ['reports GET /reports/stats', ReportsController, ReportsController.prototype.getStats],
      ['notifications GET /notifications', NotificationsController, NotificationsController.prototype.findAll],
      ['analytics GET /analytics/dashboard', AnalyticsController, AnalyticsController.prototype.getDashboard],
    ])('allows %s', (_name, cls, handler) => {
      expect(guard.canActivate(context(handler, cls))).toBe(true);
    });
  });

  describe('RolesGuard still denies accountant on restricted routes', () => {
    it.each([
      ['appointments POST /appointments', AppointmentsController, AppointmentsController.prototype.create],
      ['appointments GET /appointments/today', AppointmentsController, AppointmentsController.prototype.getToday],
      ['sessions POST /sessions', SessionsController, SessionsController.prototype.create],
      ['files GET /files', FilesController, FilesController.prototype.getEntityFiles],
      ['beneficiaries POST /beneficiaries', BeneficiariesController, BeneficiariesController.prototype.create],
    ])('denies %s', (_name, cls, handler) => {
      expect(() => guard.canActivate(context(handler, cls))).toThrow();
    });
  });

  describe('users / tenants denied at permission layer', () => {
    it('accountant does not hold user:view or tenant:view', () => {
      const perms = getPermissionsForRole(UserRole.ACCOUNTANT as any);
      expect(perms).not.toContain(Permission.USER_VIEW);
      expect(perms).not.toContain(Permission.TENANT_VIEW);
    });

    it('users and tenants list routes require user:view / tenant:view', () => {
      const userReq = Reflect.getMetadata(PERMISSIONS_KEY, UsersController.prototype.findAll);
      const tenantReq = Reflect.getMetadata(PERMISSIONS_KEY, TenantsController.prototype.findAll);
      expect(userReq).toContain(Permission.USER_VIEW);
      expect(tenantReq).toContain(Permission.TENANT_VIEW);
    });
  });
});
