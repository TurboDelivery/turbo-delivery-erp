import { z } from 'zod';

const cyclePaiementSchema = z.enum(['MENSUEL', 'TRIMESTRIEL', 'SEMESTRIEL', 'ANNUEL']);

export const chargeFixeCreateSchema = z.object({
  designation: z.string().trim().min(2, 'La designation est requise'),
  categorieId: z.string().uuid("La categorie est invalide"),
  cyclePaiement: cyclePaiementSchema,
  montant: z.number().positive('Le montant doit etre superieur a 0'),
  echeanceJour: z
    .number()
    .int("Le jour d'echeance doit etre un entier")
    .min(1, "Le jour d'echeance doit etre compris entre 1 et 31")
    .max(31, "Le jour d'echeance doit etre compris entre 1 et 31"),
});

export const chargeFixeUpdateSchema = chargeFixeCreateSchema.partial();

// Utilise le meme contrat pour le formulaire (create/edit) afin de garder une validation unique.
export const chargeFixeFormSchema = chargeFixeCreateSchema;

export type ChargeFixeCreateDTO = z.infer<typeof chargeFixeCreateSchema>;
export type ChargeFixeUpdateDTO = z.infer<typeof chargeFixeUpdateSchema>;
export type ChargeFixeFormDTO = z.infer<typeof chargeFixeFormSchema>;

