import { z } from "zod";

export const step3Schema = z.object({
  weight: z.number().min(1, { message: "Inserire un peso valido" }),
  height: z.number().min(1, { message: "Inserire un'altezza valida" }),

  sport: z.string().nonempty("Lo sport è obbligatorio."),

  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
});

export type Step3SchemaType = z.infer<typeof step3Schema>;
