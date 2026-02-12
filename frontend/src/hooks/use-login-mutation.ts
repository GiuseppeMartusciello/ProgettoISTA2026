// hooks/useLoginMutation.ts
import { useMutation } from "@tanstack/react-query";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { showLoginSuccessToast } from "../utils/login.utils";

export const useLoginMutation = () => {
  const { login } = useUser();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      login(data.email, data.password),

    onSuccess: async (result, _variables) => {

      if(result.requires2fa) { 
        navigate(`/auth/2fa?challengeId=${result.challengeId}`, { replace: true });
        toast.info("Autenticazione a due fattori richiesta.");
      }
      else {
        showLoginSuccessToast(result.user);
        navigate("/patients", { replace: true });
      }
    },
    onError: (error: AxiosError<any>) => {
      let message = error?.response?.data?.message || "Errore sconosciuto";
      if (Array.isArray(message)) message = message.join(" | ");
      toast.error(`Ooops: ${message}`);
    },
  });
};
