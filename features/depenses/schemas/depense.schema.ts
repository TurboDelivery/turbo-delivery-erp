import z from 'zod';

export const DepenseCreateSchema = z.object({
  description: z.string().min(1, 'La description est obligatoire'),
  montant: z.number().min(1, 'Le montant doit être supérieur à 0'),
  dateDepense: z.date({ message: 'La date de dépense est obligatoire' }),
  typeDepense: z.string().min(1, 'Le type de dépense est obligatoire'),
  categorieDepense: z.string({ message: 'La catégorie est obligatoire' }),
  sourcePaiement: z
    .string({
      message: 'La source est obligatoire',
    })
    .min(1, 'La source obligatoire'),
  investissementId: z.string({ message: "L'investissement n'est pas valide" }).optional(),
});

export type DepenseCreateDTO = z.infer<typeof DepenseCreateSchema>;

// Schéma pour la mise à jour d'une dépense
export const DepenseUpdateSchema = DepenseCreateSchema.partial();
export type DepenseUpdateDTO = z.infer<typeof DepenseUpdateSchema>;
