import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { addMedicalExamination } from "../api/doctor";
import { MedicalExaminationDTO } from "../types/medical-examination.dto";

export const useAddMedicalExamination = (onSuccess: () => void) => {
  const queryClient = useQueryClient();
  //const navigate = useNavigate();

  return useMutation({
    mutationFn: ({
      medicalExamination,
      reservationId,
    }: {
      medicalExamination: MedicalExaminationDTO;
      reservationId: string;
    }) => {
      console.log("Sto inviando i dati al backend");
      return addMedicalExamination(medicalExamination, reservationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations/patient"] });

      console.log("Success");
      toast.success("Visita medica inserita con successo");

      onSuccess();
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
