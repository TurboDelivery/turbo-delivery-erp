// schemas/pret.schema.ts
import { z } from "zod"

export const pretSchema = z.object({
  nomRestaurant: z.string().min(1, "Le nom du prêteur est obligatoire"),
  totalCommande: z.number().min(0, "Le montant doit être positif"),
  totalFraisLivraisons: z.number().min(0, "Le montant doit être positif"),
  totalCommission: z.number().min(0, "Le montant doit être positif"),
  deadline: z.string().min(1, "La date de deadline est requise"),
  recouvrement: z.array(z.object({
    id: z.string(),
    montant: z.number().min(0),
    dateRecouvrement: z.string(),
    preuve: z.string().optional()
  })).optional()
})

export type PretCreateDTO = z.infer<typeof pretSchema>;

// Schéma pour la mise à jour d'une dépense
export const PretUpdateSchema = pretSchema.partial();
export type PretUpdateDTO = z.infer<typeof PretUpdateSchema>;
