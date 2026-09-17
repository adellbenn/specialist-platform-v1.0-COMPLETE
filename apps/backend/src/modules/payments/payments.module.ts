import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ServicePackage } from './service-package.entity';
import { Subscription } from './subscription.entity';
import { Invoice } from './invoice.entity';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServicePackage, Subscription, Invoice, Beneficiary])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
