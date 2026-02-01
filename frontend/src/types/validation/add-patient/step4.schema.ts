import { z } from "zod";

export const step4Schema = z.object({
  bloodType: z
    .string()
    .nonempty("Il gruppo sanguigno è obbligatorio")
    .refine(
      (val) => ["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"].includes(val),
      { message: "Gruppo sanguigno non valido" }
    ),

  patologies: z.array(z.string().min(1, "Inserisci una patologia valida")),

  medications: z.array(z.string().min(1, "Inserisci un farmaco valido")),

  injuries: z.array(z.string().min(1, "Inserisci un infortunio valido")),
});

export type Step4SchemaType = z.infer<typeof step4Schema>;
