import { z } from "zod";

export const passwordSchema = z
  .string()
  .nonempty("La password è obbligatoria.")
  .min(8, "La password deve contenere almeno 8 caratteri.")
  .refine((val) => /[a-z]/.test(val), {
    message: "La password deve contenere almeno una lettera minuscola.",
  })
  .refine((val) => /[A-Z]/.test(val), {
    message: "La password deve contenere almeno una lettera maiuscola.",
  })
  .refine((val) => /[0-9]/.test(val), {
    message: "La password deve contenere almeno un numero.",
  })
  .refine((val) => /[$&+,:;=?@#|'<>.^*()%!-]/.test(val), {
    message: "La password deve contenere almeno un simbolo speciale.",
  });
