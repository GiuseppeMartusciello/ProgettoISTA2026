import { Module } from '@nestjs/common';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './reservation.entity';
import { Availability } from 'src/availability/availability.entity';
import { Doctor } from 'src/doctor/doctor.entity';
import { Patient } from 'src/patient/patient.entity';
import { VisitType } from './visit-type.entity';

@Module({
  controllers: [ReservationController],
  providers: [ReservationService],
  imports: [
    TypeOrmModule.forFeature([
      Reservation,
      Availability,
      Doctor,
      Patient,
      VisitType,
    ]),
  ],
})
export class ReservationModule {}
