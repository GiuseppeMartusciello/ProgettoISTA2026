// hooks/useLoginMutation.ts
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { disable2fa } from "../api/auth";
import { fetchUserMe } from "../api/user";
import { useUser } from "../context/UserContext";


export  const useDisable2FAMutation = () => {
  const { setUser } = useUser();

  
  return useMutation({
    mutationFn: (code: string) => disable2fa(code),

    onSuccess: async () => {
      toast.success("Autenticazione a due fattori disabilitata con successo");

      const me = await fetchUserMe();
      setUser(me);
    }
  });
};
  