import { z } from 'zod';

export const chargeVariableFormSchema = z.object({
  designation: z.string().trim().min(2, 'La designation est requise'),
  categorieId: z.string().min(1, 'La categorie est requise'),
  montant: z.number().positive('Le montant doit etre superieur a 0'),
  description: z.string().optional(),
});

export type ChargeVariableFormDTO = z.infer<typeof chargeVariableFormSchema>;
