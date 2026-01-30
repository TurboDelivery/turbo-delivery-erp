import z from 'zod';

export const DepenseCreateSchema = z.object({
  description: z.string().min(1, 'La description est obligatoire'),
  montant: z.number().min(1, 'Le montant doit être supérieur à 0'),
  dateDepense: z.date(),
  categorie: z.object({
    id: z.string().uuid('ID de catégorie invalide'),
  }),
});

export type DepenseCreateDTO = z.infer<typeof DepenseCreateSchema>;

// Schéma pour la mise à jour d'une dépense
export const DepenseUpdateSchema = DepenseCreateSchema.partial();
export type DepenseUpdateDTO = z.infer<typeof DepenseUpdateSchema>;
