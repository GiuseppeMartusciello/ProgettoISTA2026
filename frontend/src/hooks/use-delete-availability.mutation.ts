// hooks/useLogoutMutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { deleteAvailability } from "../api/doctor";

export const useDeleteAvailabilityMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idAvailability: string) => {
      console.log("Sto inviando i dati al backend");
      return deleteAvailability(idAvailability);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availabilities"] });

      console.log("Success");
      toast.success("Disponibilità eliminata con successo!");

      //navigate("/patient");
    },
    onError: (error: AxiosError<any>) => {
      let message = error?.response?.data?.message || "Errore sconosciuto";
      console.log("Error:", error);
      if (Array.isArray(message)) message = message.join(" | ");
      toast.error(`${message}`);
      // navigate("/home");
    },
    retry: false,
  });
};
