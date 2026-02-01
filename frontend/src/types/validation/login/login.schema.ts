import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().nonempty("Inserisci l'email.").email("Email non valida."),

  password: z.string().nonempty("Inserisci la password."),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;
