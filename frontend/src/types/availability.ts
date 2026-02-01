export interface AvailabilitySlotDto {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
}

export interface GroupedAvailabilities {
  date: string;

  slots: AvailabilitySlotDto[];
}
