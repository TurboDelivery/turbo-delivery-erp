import { z } from 'zod';

export const BonLivraisonTermineeSchema = z.object({
  code: z.string().optional(),
  commandeId: z.string().optional(),
  reference: z.string().optional(),
  livreurId: z.string().optional(),
  livreur: z.string().optional(),
  restaurant: z.string().optional(),
  restaurantId: z.string().optional(),
  coutLivraison: z.number().optional(),
  coutCommande: z.number().optional(),
  commission: z.number().optional(),
  date: z.string().optional(),
  heure: z.string().optional(),
  statut: z.string().optional(),
});

export type BonLivraisonTermineeType = z.infer<typeof BonLivraisonTermineeSchema>;
