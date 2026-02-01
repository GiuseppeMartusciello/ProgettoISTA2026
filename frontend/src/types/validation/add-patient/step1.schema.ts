import { z } from "zod";

export const step1Schema = z.object({
  name: z
    .string()
    .nonempty("Il nome è obbligatorio.")
    .min(2, "Il nome deve contenere almeno 2 caratteri."),
  surname: z
    .string()
    .nonempty("Il cognome è obbligatorio.")
    .min(2, "Il cognome deve contenere almeno 2 caratteri."),
  email: z
    .string()
    .nonempty("L'email è obbligatoria.")
    .email("Email non valida."),
  cf: z.string().nonempty("Il cf e' obbligatorio."),

  // birthDate: z
  //   .string()
  //   .nonempty("La data di nascita è obbligatoria")
  //   .refine((val) => !isNaN(Date.parse(val)), {
  //     message: "La data non è valida",
  //   }),

  gender: z.enum(["Uomo", "Donna", "Altro"], {
    message: "Scegli il tuo genere.",
  }),
  phone: z
    .string()
    .nonempty("Il numero di telefono è obbligatorio.")
    .regex(/^\d+$/, {
      message: "Il numero di telefono deve contenere solo cifre.",
    })
    .min(8, { message: "Il numero di telefono deve avere almeno 8 cifre" })
    .max(10, { message: "Il numero di telefono deve essere al più 10 cifre" }),
});

export type Step1SchemaType = z.infer<typeof step1Schema>;
