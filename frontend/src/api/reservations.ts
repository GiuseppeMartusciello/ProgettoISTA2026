import api from "../services/axiosInstance";
import { GroupedReservations, ReservationsDTO } from "../types/reservation";
import { ReservationItem } from "../types/reservation-item";
import { PatchedReservation } from "../hooks/use-patch-reservation.mutation";
import { Range } from "../hooks/use-reservations";

export enum VisitTypeEnum {
  FIRST = "FIRST_VISIT",
  CONTROL = "CONTROL",
}

export interface CreateDoctorReservationDto {
  patientId: string;
  startTime: string; // ISO8601 format
  endTime: string; // ISO8601 format
  visitType: VisitTypeEnum;
}

export interface SlotItem {
  startTime: string;
  endTime: string;
}

export async function checkIsFirstVisit(patientId?: string) {
  const params = patientId ? `?patientId=${patientId}` : '';
  const res = await api.get<{ isFirstVisit: boolean }>(`reservations/isFirstVisit${params}`, {
    withCredentials: true,
  });
  return res.data;
}

export async function fetchSlots(date: string, visitType: VisitTypeEnum) {
  const res = await api.get<SlotItem[]>(
    `reservations/slots?date=${date}&visitType=${visitType}`,
    {
      withCredentials: true,
    }
  );
  return res.data;
}

export async function createReservationForPatient(
  body: CreateDoctorReservationDto
) {
  const res = await api.post("reservations/for-patient", body, {
    withCredentials: true,
  });
  return res.data;
}



export async function fetchReservations(
  range: Range | null,
  status: "ALL" | "CONFIRMED" | "PENDING"
) {
  const params = new URLSearchParams();

  if (range) {
    if (range?.start) params.append("start", range.start.toISOString());
    if (range?.end) params.append("end", range.end.toISOString());
  }

  if (status) params.append("status", status);

  const res = await api.get<GroupedReservations[]>(
    `reservations?${params.toString()}`,

    {
      withCredentials: true,
    }
  );

  console.log("Prenotazioni", res.data);

  return res.data;
}

export async function fetchReservationsTable(
  patient: string | null,
  page: null | number,
  limit: null | number,
  search: null | string
) {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());

  if (limit) params.append("limit", limit.toString());

  if (search) params.append("search", search);

  params.append("status", "CONFIRMED");

  const res = await api.get<{ total: number; reservations: ReservationItem[] }>(
    `reservations/${patient}/?${params.toString()}`,

    {
      withCredentials: true,
    }
  );

  console.log("Prenotazioni tabella", res.data);

  return res.data;
}

export async function patchReservation(reservation: PatchedReservation) {
  await api.patch<ReservationsDTO>(
    `reservations/${reservation.reservationId}/${reservation.status}`,
    {
      withCredentials: true,
    }
  );

  return reservation.status;
}

export async function fetchHowManyReservations() {
  const res = await api.get<{ total: number }>(
    `reservations/count`,

    {
      withCredentials: true,
    }
  );

  console.log("Count ", res.data);
  return res.data;
}