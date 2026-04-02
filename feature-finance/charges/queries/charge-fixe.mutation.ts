'use client';

import { useMutation } from '@tanstack/react-query';
import {
  ajouterChargeFixeAction,
  modifierChargeFixeAction,
  supprimerChargeFixeAction,
  validerDGAChargeFixeAction,
  approuverDGChargeFixeAction,
  rejeterDGAChargeFixeAction,
  rejeterDGChargeFixeAction,
  decaisserChargeFixeAction,
} from '../actions/charge-fixe.action';
import { useInvalidateChargeFixeQuery } from './index.query';
import { IChargeFixeCreateDTO, IChargeFixeUpdateDTO, IWorkflowDecisionDtoFixe } from '../types/charge-fixe.type';
import { toast } from 'sonner';

export type ActionWorkflowFixe = 'valider-dga' | 'approuver-dg' | 'rejeter-dga' | 'rejeter-dg' | 'decaisser';

export const useAjouterChargeFixeMutation = () => {
  const invalidateChargeFixeQuery = useInvalidateChargeFixeQuery();

  return useMutation({
    mutationFn: async (data: IChargeFixeCreateDTO) => {
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
    mutationFn: async ({ id, data }: { id: string; data: IChargeFixeUpdateDTO }) => {
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

export const useActionChargeFixeMutation = () => {
  const invalidateChargeFixeQuery = useInvalidateChargeFixeQuery();

  return useMutation({
    mutationFn: async ({
      id,
      action,
      dto,
    }: {
      id: string;
      action: ActionWorkflowFixe;
      dto: IWorkflowDecisionDtoFixe;
    }) => {
      const actionMap: Record<ActionWorkflowFixe, (id: string, dto: IWorkflowDecisionDtoFixe) => Promise<unknown>> = {
        'valider-dga': validerDGAChargeFixeAction,
        'approuver-dg': approuverDGChargeFixeAction,
        'rejeter-dga': rejeterDGAChargeFixeAction,
        'rejeter-dg': rejeterDGChargeFixeAction,
        decaisser: decaisserChargeFixeAction,
      };
      const result = (await actionMap[action](id, dto)) as { success: boolean; error?: string; data?: unknown };
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la mise à jour');
      }
      return result.data;
    },
    onSuccess: async () => {
      await invalidateChargeFixeQuery();
      toast.success('Action effectuée avec succès');
    },
    onError: (error) => {
      toast.error("Erreur lors de l'action", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

