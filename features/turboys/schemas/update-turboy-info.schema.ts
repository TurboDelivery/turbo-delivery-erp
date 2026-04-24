import { z } from 'zod';

export const updateTurboyInfoSchema = z.object({
  // Informations personnelles
  nom: z.string().min(1, 'Le nom est requis'),
  prenoms: z.string().min(1, 'Le prénom est requis'),
  birthDay: z.string().min(1, 'La date de naissance est requise'),
  habitation: z.string().min(1, 'Le domicile est requis'),
  telephone: z.string().min(1, 'Le téléphone est requis'),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Adresse email invalide').or(z.literal('')).optional(),

  // Document d'identité
  typeDocument: z.string().optional(),
  numeroCni: z.string().min(1, 'Le numéro de pièce est requis'),

  // Véhicule
  typeVehicule: z.string().optional(),
  nomVehicule: z.string().optional(),
  immatriculation: z.string().min(1, "L'immatriculation est requise"),

  // Compte (pas de mot de passe en modification)
  telephoneCompte: z.string().min(1, 'Le numéro de téléphone du compte est requis'),

  // Commission
  commission: z.coerce.number().min(0).optional(),
});

export type UpdateTurboyInfoDTO = z.infer<typeof updateTurboyInfoSchema>;
