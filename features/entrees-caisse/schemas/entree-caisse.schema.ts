import { z } from 'zod';

export const entreeCaisseSchema = z.object({
  libelle: z.string().min(1, 'Le libellé est obligatoire'),
  montant: z.number().min(0, 'Le montant doit être positif'),
  dateEntree: z.string().min(1, "La date d'entrée est obligatoire"),
  commentaire: z.string().optional().default(''),
  paye: z.boolean().optional().default(false),
});

export type EntreeCaisseCreateDTO = z.infer<typeof entreeCaisseSchema>;

export const entreeCaisseUpdateSchema = entreeCaisseSchema.partial();
export type EntreeCaisseUpdateDTO = z.infer<typeof entreeCaisseUpdateSchema>;
