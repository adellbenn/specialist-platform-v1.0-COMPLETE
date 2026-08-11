import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './appointment.entity';
import { Session } from '@modules/sessions/session.entity';
import { User } from '@modules/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Session, User])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
