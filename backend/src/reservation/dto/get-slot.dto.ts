import { IsISO8601, IsNotEmpty } from 'class-validator';

export class GetSlot {
  @IsNotEmpty()
  @IsISO8601()
  date: Date;
}
