// hooks/useLoginMutation.ts
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { confirm2fa } from "../api/auth";

import { fetchUserMe } from "../api/user";
import { useUser } from "../context/UserContext";

export const useConfirm2FAMutation = () => {
  const { setUser } = useUser();

  return useMutation({
    mutationFn: ({otp }: { otp: string }) => confirm2fa (otp),

    onSuccess: async ( _variables) => {
      toast.success("Autenticazione a due fattori abilitata con successo");

      const me = await fetchUserMe();
      setUser(me);

    },
    onError: (error: AxiosError<any>) => {
      let message = error?.response?.data?.message || "Errore sconosciuto";
      if (Array.isArray(message)) message = message.join(" | ");
      toast.error(`Ooops: ${message}`);
    },
  });
};
