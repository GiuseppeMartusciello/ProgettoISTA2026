import { z } from "zod";

export const step4Schema = z.object({
  bloodType: z
    .string()
    .nonempty("Il gruppo sanguigno è obbligatorio")
    .refine(
      (val) => ["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"].includes(val),
      { message: "Gruppo sanguigno non valido" }
    ),

  pathologies: z.array(z.string().min(1, "Inserisci una patologia valida")).default([]),

  medications: z.array(z.string().min(1, "Inserisci un farmaco valido")).default([]),

  injuries: z.array(z.string().min(1, "Inserisci un infortunio valido")).default([]),
});

export type Step4SchemaType = z.infer<typeof step4Schema>;
