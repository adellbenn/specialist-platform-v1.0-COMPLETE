import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ServicePackage } from './service-package.entity';
import { Subscription } from './subscription.entity';
import { Invoice } from './invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServicePackage, Subscription, Invoice])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
