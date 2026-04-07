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
import { IWorkflowDecisionDtoFixe } from '../types/charge-fixe.type';
import { toast } from 'sonner';
import { ChargeFixeCreateDTO, ChargeFixeUpdateDTO } from '../schemas/charge-fixe.schema';
import { chargeFixeAPI } from '../apis/charge-fixe.api';

export type ActionWorkflowFixe = 'valider-dga' | 'approuver-dg' | 'rejeter-dga' | 'rejeter-dg' | 'decaisser';

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

export const useToggleEnableChargeFixeMutation = () => {
  const invalidateChargeFixeQuery = useInvalidateChargeFixeQuery();

  return useMutation({
    mutationFn: async ({ id, enable, supprimerDepense }: { id: string; enable: boolean; supprimerDepense: boolean }) => {
      return chargeFixeAPI.toggleEnableChargeFixe(id, enable, supprimerDepense);
    },
    onSuccess: async () => {
      await invalidateChargeFixeQuery();
      toast.success('Charge fixe mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour', {
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

