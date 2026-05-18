import { z } from 'zod';

export const factureValidationSchema = z.object({
  montantValide: z.number().optional(),
  commentaire: z.string().optional(),
});

export const factureRecouvrementAssignSchema = z.object({
  agentId: z.string().uuid({ message: "Agent requis" }),
});

export const facturePreuveSchema = z.object({
  preuveUrl: z.string().min(1, { message: "URL de la preuve requis" }),
  commentaire: z.string().optional(),
});

export const factureDepotPartenaireSchema = z.object({
  montantDepose: z.number({ required_error: "Montant requis" }).positive(),
  dateDepot: z.string().min(1, { message: "Date requis" }),
  reference: z.string().optional(),
});

export const factureDepotBanqueSchema = z.object({
  montantDepose: z.number({ required_error: "Montant requis" }).positive(),
  dateDepot: z.string().min(1, { message: "Date requis" }),
  reference: z.string().optional(),
});

export type FactureValidationDto = z.infer<typeof factureValidationSchema>;
export type FactureRecouvrementAssignDto = z.infer<typeof factureRecouvrementAssignSchema>;
export type FacturePreuveDto = z.infer<typeof facturePreuveSchema>;
export type FactureDepotPartenaireDto = z.infer<typeof factureDepotPartenaireSchema>;
export type FactureDepotBanqueDto = z.infer<typeof factureDepotBanqueSchema>;

// Statut options pour filtres
export const FACTURE_STATUTS = [
  { label: 'Tous', value: '' },
  { label: 'Émise', value: 'EMISE' },
  { label: 'Validée', value: 'VALIDEE' },
  { label: 'En recouvrement', value: 'EN_RECOUVREMENT' },
  { label: 'Preuve ajoutée', value: 'PREUVE_AJOUTEE' },
  { label: 'Dépôt partenaire', value: 'DEPOT_PARTENAIRE' },
  { label: 'Dépôt banque', value: 'DEPOT_BANQUE' },
  { label: 'Visée DG', value: 'VISEE_DG' },
  { label: 'Payée', value: 'PAYEE' },
  { label: 'Litigieuse', value: 'LITIGIEUSE' },
] as const;

// Période options
export const FACTURE_PERIODES = [
  { label: 'Mois en cours', value: 'mois' },
  { label: 'Semaine en cours', value: 'semaine' },
  { label: 'Trimestre', value: 'trimestre' },
  { label: 'Année', value: 'annee' },
  { label: 'Personnalisée', value: 'personnalisee' },
] as const;
