import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { Session } from './session.entity';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Beneficiary])],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
