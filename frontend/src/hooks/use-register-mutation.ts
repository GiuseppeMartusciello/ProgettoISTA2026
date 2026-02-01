// hooks/useLoginMutation.ts
import { useMutation } from "@tanstack/react-query";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

import { RegisterInfo } from "../types/registration-form";

export const useRegisterMutation = () => {
  const navigate = useNavigate();
  const { register } = useUser();

  return useMutation({
    mutationFn: (data: RegisterInfo) => register(data),
    onSuccess: (user) => {
      if (user.gender === "Uomo") toast.success(`Benvenuto ${user.name} :)`);
      else if (user.gender === "Donna")
        toast.success(`Benvenuta ${user.name} :)`);
      else toast.success(`Benvenutx ${user.name} :)`);

      console.log("entro qua dentro");
      navigate("/home");
    },
    onError: (error: AxiosError<any>) => {
      let message = error?.response?.data?.message || "Errore sconosciuto";
      if (Array.isArray(message)) message = message.join(" | ");
      toast.error(`Ooops: ${message}`);
      console.log(message);
    },
  });
};
