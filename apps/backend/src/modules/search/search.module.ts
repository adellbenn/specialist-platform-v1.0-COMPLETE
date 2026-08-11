import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';
import { Appointment } from '@modules/appointments/appointment.entity';
import { Report } from '@modules/reports/report.entity';
import { Invoice } from '@modules/payments/invoice.entity';
import { User } from '@modules/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Beneficiary, Appointment, Report, Invoice, User])],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
