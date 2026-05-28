import { z } from 'zod';

export const createTurboySchema = z.object({
  // Informations personnelles
  nom: z.string().min(1, 'Le nom est requis'),
  prenoms: z.string().min(1, 'Le prénom est requis'),
  birthDay: z.string().min(1, 'La date de naissance est requise'),
  habitation: z.string().min(1, 'Le domicile est requis'),
  telephone: z.string().min(1, 'Le téléphone est requis'),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Adresse email invalide').or(z.literal('')).optional(),

  // Document d'identité
  typeDocument: z.string().min(1, 'Le type de document est requis'),
  numeroCni: z.string().min(1, 'Le numéro de pièce est requis'),

  // Véhicule
  typeVehicule: z.string().min(1, 'Le type de véhicule est requis'),
  nomVehicule: z.string().min(1, 'Le nom du véhicule est requis'),
  immatriculation: z.string().min(1, "L'immatriculation est requise"),

  // Personne à contacter + permis
  numeroPersonneAContacter: z.string().optional(),
  permisConduire: z.boolean().optional(),

  // Compte
  telephoneCompte: z.string().min(1, 'Le numéro de téléphone du compte est requis'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export type CreateTurboyDTO = z.infer<typeof createTurboySchema>;

export const TYPE_DOCUMENT_OPTIONS = [
  { label: "Carte Nationale d'Identité", value: 'CNI' },
  { label: 'Passeport', value: 'PASSEPORT' },
  { label: 'Permis de conduire', value: 'PERMIS' },
];

export const TYPE_VEHICULE_OPTIONS = [
  { label: 'Moto', value: 'MOTO' },
  { label: 'Vélo', value: 'VELO' },
  { label: 'Voiture', value: 'VOITURE' },
  { label: 'Tricycle', value: 'TRICYCLE' },
];
