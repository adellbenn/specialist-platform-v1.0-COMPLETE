import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Beneficiary, BeneficiaryStatus } from '@modules/beneficiaries/beneficiary.entity';
import { Appointment, AppointmentStatus } from '@modules/appointments/appointment.entity';
import { Session, AttendanceStatus } from '@modules/sessions/session.entity';
import { Report, ReportStatus } from '@modules/reports/report.entity';
import { Invoice, PaymentStatus } from '@modules/payments/invoice.entity';
import { Subscription, SubscriptionStatus } from '@modules/payments/subscription.entity';
import { User, UserRole } from '@modules/users/user.entity';
import { RedisService } from '@common/redis/redis.service';

@Injectable()
export class AnalyticsService {
  private static readonly CACHE_PREFIX = 'analytics:';
  private static readonly DASHBOARD_TTL = 120; // 2 minutes
  private static readonly TREND_TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(Beneficiary) private beneficiaryRepo: Repository<Beneficiary>,
    @InjectRepository(Appointment) private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(Report) private reportRepo: Repository<Report>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Subscription) private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private redisService: RedisService,
  ) {}

  /** لوحة التحكم الرئيسية — البيانات الكاملة */
  async getDashboardStats(tenantId: string) {
    const cacheKey = `${AnalyticsService.CACHE_PREFIX}dash:${tenantId}`;
    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached) return cached;
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    const dayStart = new Date(today.setHours(0, 0, 0, 0));
    const dayEnd = new Date(today.setHours(23, 59, 59, 999));

    const [
      totalBeneficiaries,
      activeBeneficiaries,
      newThisMonth,
      newThisWeek,
      totalSessions,
      sessionsThisMonth,
      presentSessions,
      absentSessions,
      todayAppointments,
      upcomingAppointments,
      pendingReports,
      activeSubscriptions,
      expiringSubscriptions,
      totalRevenue,
      monthRevenue,
      specialists,
    ] = await Promise.all([
      // المستفيدون
      this.beneficiaryRepo.count({ where: { tenantId } }),
      this.beneficiaryRepo.count({ where: { tenantId, status: BeneficiaryStatus.ACTIVE } }),
      this.beneficiaryRepo.count({
        where: { tenantId, createdAt: MoreThanOrEqual(monthStart) } as any,
      }),
      this.beneficiaryRepo.count({
        where: { tenantId, createdAt: MoreThanOrEqual(weekStart) } as any,
      }),

      // الجلسات
      this.sessionRepo.count({ where: { tenantId } }),
      this.sessionRepo.count({ where: { tenantId, startedAt: MoreThanOrEqual(monthStart) } }),
      this.sessionRepo.count({ where: { tenantId, attendance: AttendanceStatus.PRESENT } }),
      this.sessionRepo.count({ where: { tenantId, attendance: AttendanceStatus.ABSENT } }),

      // المواعيد
      this.appointmentRepo.count({
        where: { tenantId, scheduledAt: Between(dayStart, dayEnd) },
      }),
      this.appointmentRepo.count({
        where: {
          tenantId,
          status: AppointmentStatus.SCHEDULED,
          scheduledAt: MoreThanOrEqual(new Date()),
        },
      }),

      // التقارير المعلقة
      this.reportRepo.count({ where: { tenantId, status: ReportStatus.SUBMITTED } }),

      // الاشتراكات
      this.subscriptionRepo.count({ where: { tenantId, status: SubscriptionStatus.ACTIVE } }),
      this.subscriptionRepo
        .createQueryBuilder('s')
        .where('s.tenant_id = :tenantId', { tenantId })
        .andWhere('s.status = :status', { status: SubscriptionStatus.ACTIVE })
        .andWhere('s.expiry_date <= :soon', {
          soon: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })
        .getCount(),

      // الإيرادات
      this.invoiceRepo
        .createQueryBuilder('i')
        .select('COALESCE(SUM(i.total), 0)', 'total')
        .where('i.tenant_id = :tenantId', { tenantId })
        .andWhere('i.payment_status = :status', { status: PaymentStatus.PAID })
        .getRawOne()
        .then((r) => Number(r?.total ?? 0)),

      this.invoiceRepo
        .createQueryBuilder('i')
        .select('COALESCE(SUM(i.total), 0)', 'total')
        .where('i.tenant_id = :tenantId', { tenantId })
        .andWhere('i.payment_status = :status', { status: PaymentStatus.PAID })
        .andWhere('i.paid_at >= :from', { from: monthStart })
        .getRawOne()
        .then((r) => Number(r?.total ?? 0)),

      // الأخصائيون
      this.userRepo.count({ where: { tenantId, role: UserRole.SPECIALIST, isActive: true } }),
    ]);

    const attendanceRate =
      totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

    const result = {
      beneficiaries: {
        total: totalBeneficiaries,
        active: activeBeneficiaries,
        newThisMonth,
        newThisWeek,
      },
      sessions: {
        total: totalSessions,
        thisMonth: sessionsThisMonth,
        present: presentSessions,
        absent: absentSessions,
        attendanceRate,
      },
      appointments: {
        today: todayAppointments,
        upcoming: upcomingAppointments,
        pendingReports,
      },
      subscriptions: {
        active: activeSubscriptions,
        expiringSoon: expiringSubscriptions,
      },
      financial: {
        totalRevenue,
        monthRevenue,
      },
      team: {
        specialists,
      },
    };

    await this.redisService.setJson(cacheKey, result, AnalyticsService.DASHBOARD_TTL);
    return result;
  }

  /** إحصائيات الأخصائي الخاصة */
  async getSpecialistStats(specialistId: string, tenantId: string) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const today = new Date();

    const [myBeneficiaries, mySessions, mySessionsThisMonth, pendingToday] = await Promise.all([
      this.beneficiaryRepo.count({
        where: { tenantId, assignedSpecialistId: specialistId, status: BeneficiaryStatus.ACTIVE },
      }),
      this.sessionRepo.count({ where: { tenantId, specialistId } }),
      this.sessionRepo.count({
        where: { tenantId, specialistId, startedAt: MoreThanOrEqual(monthStart) },
      }),
      this.appointmentRepo.count({
        where: {
          tenantId,
          specialistId,
          status: AppointmentStatus.SCHEDULED,
          scheduledAt: Between(
            new Date(today.setHours(0, 0, 0, 0)),
            new Date(today.setHours(23, 59, 59, 999)),
          ),
        },
      }),
    ]);

    return { myBeneficiaries, mySessions, mySessionsThisMonth, pendingToday };
  }

  /** مخطط المواعيد — آخر 6 أشهر */
  async getAppointmentsTrend(tenantId: string) {
    const cacheKey = `${AnalyticsService.CACHE_PREFIX}apt-trend:${tenantId}`;
    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached) return cached;

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const [total, completed, cancelled] = await Promise.all([
        this.appointmentRepo.count({ where: { tenantId, scheduledAt: Between(start, end) } }),
        this.appointmentRepo.count({
          where: {
            tenantId,
            status: AppointmentStatus.COMPLETED,
            scheduledAt: Between(start, end),
          },
        }),
        this.appointmentRepo.count({
          where: {
            tenantId,
            status: AppointmentStatus.CANCELLED,
            scheduledAt: Between(start, end),
          },
        }),
      ]);

      months.push({
        month: d.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' }),
        total,
        completed,
        cancelled,
      });
    }
    await this.redisService.setJson(cacheKey, months, AnalyticsService.TREND_TTL);
    return months;
  }

  /** توزيع المستفيدين حسب نوع الحالة */
  async getBeneficiariesByType(tenantId: string) {
    return this.beneficiaryRepo
      .createQueryBuilder('b')
      .select('b.case_type', 'caseType')
      .addSelect('COUNT(*)', 'count')
      .where('b.tenant_id = :tenantId', { tenantId })
      .groupBy('b.case_type')
      .getRawMany();
  }

  /** إيرادات آخر 6 أشهر */
  async getRevenueTrend(tenantId: string) {
    const cacheKey = `${AnalyticsService.CACHE_PREFIX}rev-trend:${tenantId}`;
    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached) return cached;

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const result = await this.invoiceRepo
        .createQueryBuilder('i')
        .select('COALESCE(SUM(i.total), 0)', 'revenue')
        .where('i.tenant_id = :tenantId', { tenantId })
        .andWhere('i.payment_status = :status', { status: PaymentStatus.PAID })
        .andWhere('i.paid_at BETWEEN :start AND :end', { start, end })
        .getRawOne();

      months.push({
        month: d.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' }),
        revenue: Number(result?.revenue ?? 0),
      });
    }
    await this.redisService.setJson(cacheKey, months, AnalyticsService.TREND_TTL);
    return months;
  }
}
