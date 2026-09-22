'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { encoursAPI } from '../apis/encours.api';
import { ICreateDeductionPartenaire, ICreerPerte } from '../types/encours.types';
import { useInvalidateEncours } from './encours.query';

export const useCreerDeductionMutation = () => {
  const invalidate = useInvalidateEncours();
  return useMutation({
    mutationFn: (dto: ICreateDeductionPartenaire) => encoursAPI.creerDeduction(dto),
    onSuccess: async () => {
      await invalidate();
      toast.success('Déduction ajoutée');
    },
    onError: (error) =>
      toast.error("Erreur lors de l'ajout de la déduction", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
  });
};

export const useModifierDeductionMutation = () => {
  const invalidate = useInvalidateEncours();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ICreateDeductionPartenaire }) =>
      encoursAPI.modifierDeduction(id, dto),
    onSuccess: async () => {
      await invalidate();
      toast.success('Déduction modifiée');
    },
    onError: (error) =>
      toast.error('Erreur lors de la modification', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
  });
};

export const useSupprimerDeductionMutation = () => {
  const invalidate = useInvalidateEncours();
  return useMutation({
    mutationFn: ({ id, codeSecret }: { id: string; codeSecret: string }) =>
      encoursAPI.supprimerDeduction(id, codeSecret),
    onSuccess: async () => {
      await invalidate();
      toast.success('Déduction supprimée');
    },
    onError: (error) => {
      const statut = (error as { status?: number; response?: { status?: number } });
      const est403 = statut?.status === 403 || statut?.response?.status === 403;
      toast.error(
        est403 ? 'Code de sécurité incorrect' : 'Erreur lors de la suppression',
        {
          description: est403
            ? 'La suppression est refusée tant que le code de sécurité (DG/DGA) n\'est pas correct.'
            : error instanceof Error ? error.message : 'Erreur inconnue',
        },
      );
    },
  });
};

/**
 * Enregistre une perte. Le code de validation est exigé par le serveur, qui
 * refuse en 403 s'il est faux — l'écran ne décide rien.
 */
export const useCreerPerteMutation = () => {
  const invalidate = useInvalidateEncours();
  return useMutation({
    mutationFn: ({ data, codeSecret }: { data: ICreerPerte; codeSecret: string }) =>
      encoursAPI.creerPerte(data, codeSecret),
    onSuccess: () => {
      // Tout l'écran est invalidé, pas seulement la liste : une perte SORT du stock
      // des encours, donc le bandeau global change aussi.
      invalidate();
      toast.success('Perte enregistrée.');
    },
  });
};

/** Annulation TRACÉE. Le montant revient dans les encours. */
export const useAnnulerPerteMutation = () => {
  const invalidate = useInvalidateEncours();
  return useMutation({
    mutationFn: ({ id, motif, codeSecret }: { id: string; motif: string; codeSecret: string }) =>
      encoursAPI.annulerPerte(id, motif, codeSecret),
    onSuccess: () => {
      invalidate();
      toast.success('Perte annulée — le montant revient dans les encours.');
    },
  });
};

/** Correction d'une ligne existante : montant, catégorie, précision, commentaire. */
export const useModifierPerteMutation = () => {
  const invalidate = useInvalidateEncours();
  return useMutation({
    mutationFn: ({
      id,
      data,
      codeSecret,
    }: {
      id: string;
      data: ICreerPerte;
      codeSecret: string;
    }) => encoursAPI.modifierPerte(id, data, codeSecret),
    onSuccess: () => {
      invalidate();
      toast.success('Perte corrigée.');
    },
  });
};

/** Suppression définitive. La ligne quitte l'écran, le journal d'audit la garde. */
export const useSupprimerPerteMutation = () => {
  const invalidate = useInvalidateEncours();
  return useMutation({
    mutationFn: ({ id, codeSecret }: { id: string; codeSecret: string }) =>
      encoursAPI.supprimerPerte(id, codeSecret),
    onSuccess: () => {
      invalidate();
      toast.success('Ligne supprimée.');
    },
  });
};
