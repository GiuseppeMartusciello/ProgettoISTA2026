import { Module } from '@nestjs/common';
import { InviteController } from './invite.controller';
import { InviteService } from './invite.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invite } from './invite.entity';
import { Doctor } from 'src/doctor/doctor.entity';
import { User } from 'src/user/user.entity';
import { Patient } from 'src/patient/patient.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
          Invite,
          Doctor,
          User,
          Patient
        ])
    ],
  controllers: [InviteController],
  providers: [InviteService]
})
export class InviteModule {}
