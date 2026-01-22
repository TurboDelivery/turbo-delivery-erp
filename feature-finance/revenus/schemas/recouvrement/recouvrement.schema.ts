import { z } from "zod";

export const recouvrementFormSchema = z.object({
    montant: z.number().min(1, "Le montant doit être supérieur à 0"),
    dateRecouvrement: z.string().min(1, "La date est requise"),
    restaurantId: z.string().min(1, "La sélection d'un restaurant est requise"),
    preuve: z.instanceof(File, { message: "La preuve de paiement est requise" })
        .refine(file => file.size > 0, "Le fichier ne peut pas être vide")
        .refine(file => file.size <= 5 * 1024 * 1024, "Le fichier ne doit pas dépasser 5MB")
});

export type RecouvrementCreateDTO = z.infer<typeof recouvrementFormSchema>;

// Schéma pour la mise à jour d'une dépense
export const RecouvrementUpdateSchema = recouvrementFormSchema.partial();
export type RecouvrementUpdateDTO = z.infer<typeof RecouvrementUpdateSchema>;