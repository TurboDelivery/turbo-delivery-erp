import z from "zod";

export const LivraisonCreateSchema = z.object({
    commandeId: z.string().min(1, "Le montant doit être supérieur à 0"),
    reference: z.string().min(1, "Le montant doit être supérieur à 0"),
    livreur: z.string().min(1, "Le montant doit être supérieur à 0"),
    restaurant: z.string().min(1, "Le montant doit être supérieur à 0"),
    coutLivraison: z.number().min(1, "Le montant doit être supérieur à 0"),
    coutCommande: z.number().min(1, "Le montant doit être supérieur à 0"),
    commission: z.number().min(1, "Le montant doit être supérieur à 0"),
    date: z.string().min(1, "Le montant doit être supérieur à 0"),     // ou z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    heure: z.string().min(1, "Le montant doit être supérieur à 0"),    // ou z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/)
    statut: z.string().min(1, "Le montant doit être supérieur à 0"),
    statutCourse: z.string().min(1, "Le montant doit être supérieur à 0"),
    coutLivraisonChaine: z.number().min(1, "Le montant doit être supérieur à 0"),
    coutCommandeChaine: z.number().min(1, "Le montant doit être supérieur à 0"),
    commissionChaine: z.number().min(1, "Le montant doit être supérieur à 0"),
})

export type LivraisonCreateDTO = z.infer<typeof LivraisonCreateSchema>;

// Schéma pour la mise à jour d'une livraison
export const LivraisonUpdateSchema = LivraisonCreateSchema.partial();
export type LivraisonUpdateDTO = z.infer<typeof LivraisonUpdateSchema>;