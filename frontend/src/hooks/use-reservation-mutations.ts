import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  checkIsFirstVisit,
  createReservationForPatient,
  CreateDoctorReservationDto,
  fetchSlots,
  VisitTypeEnum,
} from "../api/reservations";
import { toast } from "react-toastify";

export function useIsFirstVisit(patientId: string | undefined) {
  return useQuery({
    queryKey: ["isFirstVisit", patientId],
    queryFn: () => checkIsFirstVisit(patientId),
    enabled: !!patientId,
    retry: 1,
  });
}

export function useSlots(date: string | null, visitType: VisitTypeEnum | null) {
  return useQuery({
    queryKey: ["slots", { date, visitType }],
    queryFn: () => fetchSlots(date!, visitType!),
    enabled: !!date && !!visitType,
    retry: 1,
  });
}

export function useCreateReservationForPatient() {
    const queryClient = useQueryClient();


  return useMutation({
    mutationFn: (data: CreateDoctorReservationDto) =>
      createReservationForPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["reservations/patient"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      toast.success("Prenotazione creata con successo");
    },
  });
}
