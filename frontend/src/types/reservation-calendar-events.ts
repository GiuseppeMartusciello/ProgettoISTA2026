export interface ReservationCalendarEvent {
  id: string;
  start: Date;
  end: Date;
  createdAt: string;
  status: string;
  visitType: string;
  patient: {
    name: string;
    surname: string;
    id: string;
    gender: string;
    cf: string;
  };
}
