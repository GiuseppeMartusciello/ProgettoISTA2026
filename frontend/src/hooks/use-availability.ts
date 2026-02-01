import { useQuery } from "@tanstack/react-query";
import { fetchAvailability } from "../api/doctor";
import { GroupedAvailabilities } from "../types/availability";
import { Range } from "./use-reservations";

export function useAvailability(range: Range | null) {
  return useQuery<GroupedAvailabilities[]>({
    queryKey: ["availabilities", range],
    queryFn: () => fetchAvailability(range),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
