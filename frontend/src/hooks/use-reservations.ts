import { useQuery } from "@tanstack/react-query";
import {
  fetchReservations,
  fetchHowManyReservations,
  fetchReservationsTable,
} from "../api/doctor";
import { GroupedReservations } from "../types/reservation";
import { ReservationItem } from "../types/reservation-item";

export interface Range {
  start: Date;
  end: Date;
}

export function useReservations(
  range: Range | null,
  status: "ALL" | "CONFIRMED" | "PENDING"
) {
  return useQuery<GroupedReservations[]>({
    queryKey: ["reservations", { range, status }],
    queryFn: () => fetchReservations(range, status),

    retry: 1,
    refetchOnWindowFocus: true, // Aggiorna quando si torna sulla finestra
    refetchInterval: 1000 * 60 * 2,
  });
}

export function useReservationsTable(
  patient: string | null,
  page: null | number = 1,
  limit: null | number = 10,
  search: string = ""
) {
  return useQuery<{ total: number; reservations: ReservationItem[] }>({
    queryKey: ["reservations/patient", { page, limit, search }],
    queryFn: () => fetchReservationsTable(patient, page, limit, search),

    retry: 1,
    refetchOnWindowFocus: true, // Aggiorna quando si torna sulla finestra
    refetchInterval: 1000 * 60 * 2,
  });
}

export function useReservationCounts() {
  return useQuery<{ total: number }>({
    queryKey: ["reservations"],
    queryFn: fetchHowManyReservations,

    retry: 1,
    refetchOnWindowFocus: true, // Aggiorna quando si torna sulla finestra
    refetchInterval: 1000 * 60 * 2,
  });
}
