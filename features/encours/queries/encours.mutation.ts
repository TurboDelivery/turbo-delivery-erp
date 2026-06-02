'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { encoursAPI } from '../apis/encours.api';
import { ICreateDeductionPartenaire } from '../types/encours.types';
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
    mutationFn: (id: string) => encoursAPI.supprimerDeduction(id),
    onSuccess: async () => {
      await invalidate();
      toast.success('Déduction supprimée');
    },
    onError: (error) =>
      toast.error('Erreur lors de la suppression', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
  });
};
