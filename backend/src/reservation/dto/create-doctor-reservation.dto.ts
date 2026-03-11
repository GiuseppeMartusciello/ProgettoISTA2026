import { IsEnum, IsISO8601, IsNotEmpty, IsUUID } from 'class-validator';
import { VisitTypeEnum } from '../types/visit-type.enum';
import { Transform } from 'class-transformer';

export class CreateDoctorReservationDto {
  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @IsNotEmpty()
  @IsISO8601()
  startTime: Date;

  @IsNotEmpty()
  @IsISO8601()
  endTime: Date;

  @IsNotEmpty()
  @IsEnum(VisitTypeEnum)
  @Transform(({ value }) => value.toString())
  visitType: VisitTypeEnum;
}
