import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';
import { Appointment } from '@modules/appointments/appointment.entity';
import { Session } from '@modules/sessions/session.entity';
import { Report } from '@modules/reports/report.entity';
import { Invoice } from '@modules/payments/invoice.entity';
import { Subscription } from '@modules/payments/subscription.entity';
import { User } from '@modules/users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Beneficiary,
      Appointment,
      Session,
      Report,
      Invoice,
      Subscription,
      User,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
