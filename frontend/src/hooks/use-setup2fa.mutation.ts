// hooks/useLoginMutation.ts
import { useMutation } from "@tanstack/react-query";

import { setup2fa } from "../api/auth";

export const useSetup2FAMutation = () => {

  return useMutation({
    mutationFn: () => setup2fa(),

  });
};

