import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchPatients } from "../api/patients";

export function useInfinitePatients(limit = 20, search = "") {
  return useInfiniteQuery({
    queryKey: ["patients", { limit, search }],
    queryFn: ({ pageParam = 1 }) => fetchPatients(pageParam, limit, search),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
        
    // console.log("lastPage: ", lastPage);
    // console.log("allPages: ", allPages);
     
    return lastPage.hasMore ? allPages.length + 1 : undefined;
      
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
