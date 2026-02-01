import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchReservation } from "../api/doctor";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

export interface PatchedReservation {
  reservationId: string;
  status: "confirm" | "decline";
}

export const usePatchReservationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservation: PatchedReservation) => {
      return patchReservation(reservation);
    },
    onSuccess: (status: string) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["reservations/count"] });

      if (status === "confirm")
        toast.success("Prenotazione accettata con successo");
      else toast.success("Prenotazione rifiutata con successo");
    },
    onError: (error: AxiosError<any>) => {
      let message = error?.response?.data?.message || "Errore sconosciuto";

      console.log("Error:", error);
      if (Array.isArray(message)) message = message.join(" | ");
      toast.error(`${message}`);
    },
    retry: false,
  });
};
