import { z } from "zod";

export const step2Schema = z.object({
  address: z
    .string()
    .nonempty("L'indirizzo è obbligatorio.")
    .min(5, { message: "L'indirizzo deve contenere almeno di 5 caratteri." }),
  city: z
    .string()
    .nonempty("La citta' di residenza e' obbligatoria.")
    .min(2, { message: "La città deve contenere almeno 2 lettere." }),
  cap: z
    .string()
    .nonempty("Il CAP è obbligatorio.")
    .regex(/^\d+$/, {
      message: "Il CAP deve contenere solo cifre.",
    })
    .length(5, { message: "Il CAP deve contenere al esattamente 5 cifre." }),
  province: z
    .string()
    .nonempty("La provincia è obbligatoria.")
    .regex(/^[A-Za-z]+$/, {
      message: "La provincia deve contenere solo lettere.",
    })
    .min(2, { message: "La provincia deve contenere almeno 2 lettere." }),
});

export type Step3SchemaType = z.infer<typeof step2Schema>;
