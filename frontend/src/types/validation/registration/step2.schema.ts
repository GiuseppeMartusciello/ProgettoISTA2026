import { z } from "zod";

export const step2Schema = z.object({
  cf: z.string().nonempty("Il codice fiscale è obbligatorio."),
  // .refine((val) => {
  //   .check(val), { message: "Codice fiscale non valido." };
  // }),

  birthDate: z.string().nonempty("La data di nascita è obbligatoria."),
  phone: z
    .string()
    .nonempty("Il numero di telefono è obbligatorio.")
    .regex(/^\d+$/, {
      message: "Il numero di telefono deve contenere solo cifre.",
    })
    .min(8, { message: "Il numero di telefono deve avere almeno 8 cifre" }),

  gender: z.enum(["Uomo", "Donna", "Altro"], {
    message: "Scegli il tuo genere.",
  }),
});

export type Step2SchemaType = z.infer<typeof step2Schema>;
