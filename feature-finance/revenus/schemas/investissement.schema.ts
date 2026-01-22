import z from "zod";

export const InvestissementCreateSchema = z.object({
    nomInvestisseur: z.string().min(1, "Le nom de l'investisseur est obligatoire"),
    montant: z.number().min(1, "Le montant doit être supérieur à 0"),
    dateInvestissement: z.string().min(1, "La date est obligatoire"),
    deadline: z.string().min(1, "La date est obligatoire"),
})

export type InvestissementCreateDTO = z.infer<typeof InvestissementCreateSchema>;

// Schéma pour la mise à jour d'une dépense
export const InvestissementUpdateSchema = InvestissementCreateSchema.partial();
export type InvestissementUpdateDTO = z.infer<typeof InvestissementUpdateSchema>;