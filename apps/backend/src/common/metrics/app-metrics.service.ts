import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  appBeneficiariesTotal,
  appAppointmentsToday,
  appSessionsTotal,
  appRevenueTotal,
} from './metrics.module';
import { Beneficiary, BeneficiaryStatus } from '@modules/beneficiaries/beneficiary.entity';
import { Appointment } from '@modules/appointments/appointment.entity';
import { Session } from '@modules/sessions/session.entity';
import { Invoice, PaymentStatus } from '@modules/payments/invoice.entity';

@Injectable()
export class AppMetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppMetricsService.name);
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    @InjectRepository(Beneficiary) private beneficiaryRepo: Repository<Beneficiary>,
    @InjectRepository(Appointment) private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
  ) {}

  onModuleInit() {
    this.refreshMetrics();
    this.refreshInterval = setInterval(() => this.refreshMetrics(), 120_000);
  }

  onModuleDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  async refreshMetrics() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [activeBeneficiaries, totalBeneficiaries, todayCount, totalSessions, totalRevenue] =
        await Promise.all([
          this.beneficiaryRepo.count({ where: { status: BeneficiaryStatus.ACTIVE } }),
          this.beneficiaryRepo.count(),
          this.appointmentRepo.count({
            where: { scheduledAt: today as any },
          }),
          this.sessionRepo.count(),
          this.invoiceRepo
            .createQueryBuilder('i')
            .select('COALESCE(SUM(i.total), 0)', 'total')
            .where('i.payment_status = :status', { status: PaymentStatus.PAID })
            .getRawOne()
            .then((r) => Number(r?.total ?? 0)),
        ]);

      appBeneficiariesTotal.labels('active').set(activeBeneficiaries);
      appBeneficiariesTotal.labels('total').set(totalBeneficiaries);
      appAppointmentsToday.labels('scheduled').set(todayCount);
      appSessionsTotal.set(totalSessions);
      appRevenueTotal.set(totalRevenue);
    } catch {
      this.logger.warn('Failed to refresh app metrics');
    }
  }
}
