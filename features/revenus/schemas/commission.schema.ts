import z from "zod";

export const CommissionCreateSchema = z.object({
    commandeId: z.string().min(1, "Le montant doit être supérieur à 0"),
    restaurantId: z.string().min(1, "Le montant doit être supérieur à 0"),
    nomRestaurant: z.string().min(1, "Le montant doit être supérieur à 0"),
    localisation: z.string().min(1, "Le montant doit être supérieur à 0"),
    fraisLivraison: z.number().min(1, "Le montant doit être supérieur à 0"),
    commission: z.number().min(1, "Le montant doit être supérieur à 0"),
    totalAmount: z.number().min(1, "Le montant doit être supérieur à 0"),
})

export type CommissionCreateDTO = z.infer<typeof CommissionCreateSchema>;

// Schéma pour la mise à jour d'une dépense
export const CommissionUpdateSchema = CommissionCreateSchema.partial();
export type CommissionUpdateDTO = z.infer<typeof CommissionUpdateSchema>;