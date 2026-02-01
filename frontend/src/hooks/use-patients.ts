import { useQuery } from "@tanstack/react-query";
import { fetchPatients, fetchPatient } from "../api/patients";

export function usePatients(
  page: number = 1,
  limit: number = 10,
  search: string = ""
) {
  return useQuery({
    queryKey: ["patients", { page, limit, search }],
    queryFn: () => fetchPatients(page, limit, search),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: [`patient`, id],
    queryFn: () => fetchPatient(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
