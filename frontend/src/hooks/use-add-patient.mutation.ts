// hooks/useLogoutMutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { addPatient } from "../api/doctor";
import { CreatePatientDto } from "../types/create-patient.dto";
import { useNavigate } from "react-router-dom";

export const useAddPatientMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (patient: CreatePatientDto) => {
      console.log("Sto inviando i dati al backend");
      return addPatient(patient);
    },
    onSuccess: (patientId) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });

      console.log("Navigating to patient ID:", patientId);
      navigate(`/patients/${patientId}`);

      console.log("Success");
      toast.success("Paziente inserito con successo");
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
