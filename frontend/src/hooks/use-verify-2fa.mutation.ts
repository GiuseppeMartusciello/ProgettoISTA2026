// hooks/useLoginMutation.ts
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { showLoginSuccessToast } from "../utils/login.utils";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export const useVerify2FAMutation = () => {
  const navigate = useNavigate();
  const { twoFactorAuthenticate } = useUser();

  return useMutation({
    mutationFn: ({ challengeId, code }: { challengeId: string; code: string }) => twoFactorAuthenticate (challengeId, code),

    onSuccess: async (user, _variables) => {
      console.log("SUCCESS", user);
      showLoginSuccessToast(user);
      navigate("/patients", { replace: true });

    },
    onError: (error: AxiosError<any>) => {
      let message = error?.response?.data?.message || "Errore sconosciuto";
      if (Array.isArray(message)) message = message.join(" | ");
      toast.error(`Ooops: ${message}`);
    },
  });
};
