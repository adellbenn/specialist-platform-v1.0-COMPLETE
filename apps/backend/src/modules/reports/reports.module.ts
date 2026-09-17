import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Report } from './report.entity';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, Beneficiary])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
