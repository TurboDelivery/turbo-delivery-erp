'use client';

import { useMutation } from '@tanstack/react-query';
import {
  ajouterChargeFixeAction,
  modifierChargeFixeAction,
  supprimerChargeFixeAction,
} from '../actions/charge-fixe.action';
import { useInvalidateChargeFixeQuery } from './index.query';
import { toast } from 'sonner';
import { ChargeFixeCreateDTO, ChargeFixeUpdateDTO } from '../schemas/charge-fixe.schema';

export const useAjouterChargeFixeMutation = () => {
  const invalidateChargeFixeQuery = useInvalidateChargeFixeQuery();

  return useMutation({
    mutationFn: async (data: ChargeFixeCreateDTO) => {
      const result = await ajouterChargeFixeAction(data);

      if (!result.success) {
        throw new Error(result.error || "Erreur lors de l'ajout de la charge fixe");
      }

      return result.data!;
    },
    onSuccess: async () => {
      await invalidateChargeFixeQuery();
      toast.success('Charge fixe ajoutée avec succès');
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout de la charge fixe", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useModifierChargeFixeMutation = () => {
  const invalidateChargeFixeQuery = useInvalidateChargeFixeQuery();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ChargeFixeUpdateDTO }) => {
      const result = await modifierChargeFixeAction(id, data);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la modification de la charge fixe');
      }

      return result.data!;
    },
    onSuccess: async () => {
      await invalidateChargeFixeQuery();
      toast.success('Charge fixe modifiée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la modification de la charge fixe', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useSupprimerChargeFixeMutation = () => {
  const invalidateChargeFixeQuery = useInvalidateChargeFixeQuery();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await supprimerChargeFixeAction(id);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression de la charge fixe');
      }
    },
    onSuccess: async () => {
      await invalidateChargeFixeQuery();
      toast.success('Charge fixe supprimée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression de la charge fixe', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

