import { z } from "zod";

export const step4Schema = z.object({
  medicalOffice: z.string().nonempty("Lo studio medico è obbligatorio."),

  registrationNumber: z
    .string()
    .nonempty("Il numero di iscrizione è obbligatorio."),

  orderProvince: z.string().nonempty("La provinca d'ordine è obbligatoria."),

  orderDate: z.string().nonempty("La data di iscrizione è obbligatoria."),

  orderType: z.string().nonempty("Il tipo dell'ordine è obbligatorio."),

  specialization: z.string().nonempty("La specializzazion è obbligatoria."),
});

export type Step4SchemaType = z.infer<typeof step4Schema>;
