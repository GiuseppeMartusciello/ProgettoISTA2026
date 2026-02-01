import { useInfiniteQuery } from "@tanstack/react-query";
import { getMedicalExaminations } from "../api/doctor";
import { MedicalExaminationsResponse } from "../types/medicalExaminationResponse.interface";

export function useMedicalExamination(patientId: string, limit: number = 3) {
  return useInfiniteQuery({
    queryKey: ["medical-examinations", patientId],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => {
      console.log("Calling API with pageParam:", pageParam); // ⭐ Debug
      return getMedicalExaminations(patientId, limit, pageParam);
    },
    getNextPageParam: (lastPage: MedicalExaminationsResponse) => {
      // ⭐ Aggiungi controlli di sicurezza
      console.log("getNextPageParam called with:", lastPage);

      if (!lastPage) {
        console.log("lastPage is undefined");
        return undefined;
      }

      if (!lastPage.pagination) {
        console.log("lastPage.pagination is undefined");
        return undefined;
      }

      const nextCursor = lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;

      console.log("getNextPageParam returning:", nextCursor);
      return nextCursor;
    },
    initialPageParam: undefined,
    enabled: !!patientId,
  });
}
