import { AvailabilitySlotDto } from '../dto/availability-slot.dto';

export interface GroupedAvailabilities {
  date: string;
  slots: AvailabilitySlotDto[];
}
