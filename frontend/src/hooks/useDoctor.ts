import { useQuery } from "@tanstack/react-query";
import { fetchDoctor } from "../api/doctor";

export function useDoctor() {
  return useQuery({
    queryKey: ["doctor"],
    queryFn: fetchDoctor,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
