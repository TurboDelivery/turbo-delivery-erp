import z from "zod";

export const DepenseCreateSchema = z.object({
    libelle: z.string().min(1, "Le libellé est obligatoire"),
    montant: z.number().min(1, "Le montant doit être supérieur à 0"),
    description: z.string().optional(),
    dateDepense: z.string().min(1, "La date est obligatoire"),
    categorie: z.object({
        id: z.string().uuid("ID de catégorie invalide")
      })})

export type DepenseCreateDTO = z.infer<typeof DepenseCreateSchema>;

// Schéma pour la mise à jour d'une dépense
export const DepenseUpdateSchema = DepenseCreateSchema.partial();
export type DepenseUpdateDTO = z.infer<typeof DepenseUpdateSchema>;