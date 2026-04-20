import { z } from 'zod';

export const createRestaurantSchema = z.object({
  nomEtablissement: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional().or(z.literal('')),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: z.string().min(1, 'Le téléphone est requis'),
  codePostal: z.string().optional().or(z.literal('')),
  commune: z.string().optional().or(z.literal('')),
  localisation: z.string().optional().or(z.literal('')),
  siteWeb: z.string().optional().or(z.literal('')),
  typeCommission: z.string().optional().or(z.literal('')),
  commission: z.coerce.number().min(0).optional(),
  methodRecouvrement: z.enum(['QUOTIDIEN', 'HEBDOMADAIRE', 'QUINZAINE', 'MENSUEL']).optional(),
});

export type CreateRestaurantDTO = z.infer<typeof createRestaurantSchema>;

export const METHOD_RECOUVREMENT_OPTIONS = [
  { value: 'MENSUEL', label: 'Mensuelle' },
  { value: 'QUINZAINE', label: 'Bi-hebdomadaire' },
  { value: 'HEBDOMADAIRE', label: 'Hebdomadaire' },
  { value: 'QUOTIDIEN', label: 'Journalière' },
];

export const TYPE_COMMISSION_OPTIONS = [
  { value: 'FIXE', label: 'Fixe' },
  { value: 'POURCENTAGE', label: 'Pourcentage' },
];
