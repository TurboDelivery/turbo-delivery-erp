import { z } from 'zod';

// V54 (2026-05) — Ajout de SUPERVISEUR_LIVREUR aligné sur la note de cadrage
// DGA du 28/05/2026 (cf. types/turboys.types.ts > TurboyType).
export const TurboyTypeEnum = z.enum(['INDEPENDANT', 'JOURNALIER', 'SUPERVISEUR_LIVREUR']);

export const UpdateTurboyTypeSchema = z.object({
  id: z.string().min(1, 'L\'ID du livreur est requis'),
  typeLivreur: TurboyTypeEnum,
  salaire: z.number().positive('Le salaire doit être positif').optional(),
}).refine(
  (data) => {
    // Si le type est JOURNALIER, le salaire est obligatoire
    return !(data.typeLivreur === 'JOURNALIER' && (!data.salaire || data.salaire <= 0));
  },
  {
    message: 'Le salaire est obligatoire pour un livreur journalier',
    path: ['salaire'],
  }
);

export type UpdateTurboyTypeDTO = z.infer<typeof UpdateTurboyTypeSchema>;

