'use client';

import { useMutation } from '@tanstack/react-query';
import {
  ajouterChargeVariableFormDataAction,
  modifierChargeVariableFormDataAction,
  supprimerChargeVariableAction,
  validerDGAChargeVariableAction,
  approuverDGChargeVariableAction,
  rejeterDGAChargeVariableAction,
  rejeterDGChargeVariableAction,
  decaisserChargeVariableAction,
} from '../actions/charge-variable.action';
import { useInvalidateChargeVariableQuery } from './index-charge-variable.query';
import { IChargeVariable, IChargeVariableCreateDTO, IChargeVariableUpdateDTO, IWorkflowDecisionDto } from '../types/charge-variable.type';
import { toast } from 'sonner';

function buildChargeVariableFormData(
  data: IChargeVariableCreateDTO,
  file?: File | null,
): FormData {
  const fd = new FormData();
  fd.append('designation', data.designation);
  fd.append('categorieId', data.categorieId);
  fd.append('cyclePaiement', data.cyclePaiement);
  fd.append('montant', String(data.montant));
  fd.append('echeanceJour', String(data.echeanceJour));
  fd.append('automatique', String(data.automatique));
  if (data.description) fd.append('description', data.description);
  if (data.creerPar) fd.append('creerPar', data.creerPar);
  if (file) fd.append('justificatif', file);
  return fd;
}

export const useAjouterChargeVariableMutation = () => {
  const invalidateChargeVariableQuery = useInvalidateChargeVariableQuery();

  return useMutation({
    mutationFn: async ({ data, file }: { data: IChargeVariableCreateDTO; file?: File | null }) => {
      const fd = buildChargeVariableFormData(data, file);
      const result = await ajouterChargeVariableFormDataAction(fd);

      if (!result.success) {
        throw new Error(result.error || "Erreur lors de l'ajout de la charge variable");
      }

      return result.data!;
    },
    onSuccess: async () => {
      await invalidateChargeVariableQuery();
      toast.success('Charge variable ajoutée avec succès');
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout de la charge variable", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useModifierChargeVariableMutation = () => {
  const invalidateChargeVariableQuery = useInvalidateChargeVariableQuery();

  return useMutation({
    mutationFn: async ({ id, data, file }: { id: string; data: IChargeVariableUpdateDTO; file?: File | null }) => {
      const fd = buildChargeVariableFormData(data, file);
      const result = await modifierChargeVariableFormDataAction(id, fd);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la modification de la charge variable');
      }

      return result.data!;
    },
    onSuccess: async () => {
      await invalidateChargeVariableQuery();
      toast.success('Charge variable modifiée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la modification de la charge variable', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useSupprimerChargeVariableMutation = () => {
  const invalidateChargeVariableQuery = useInvalidateChargeVariableQuery();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await supprimerChargeVariableAction(id);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression de la charge variable');
      }
    },
    onSuccess: async () => {
      await invalidateChargeVariableQuery();
      toast.success('Charge variable supprimée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression de la charge variable', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export type ActionWorkflow = 'valider-dga' | 'approuver-dg' | 'rejeter-dga' | 'rejeter-dg' | 'decaisser';

const ACTION_LABELS: Record<ActionWorkflow, string> = {
  'valider-dga':  'visée par le DGA',
  'approuver-dg': 'approuvée par le DG',
  'rejeter-dga':  'rejetée par le DGA',
  'rejeter-dg':   'rejetée par le DG',
  'decaisser':    'décaissée',
};

const ACTION_FN: Record<
  ActionWorkflow,
  (id: string, dto: IWorkflowDecisionDto) => Promise<import('@/types').ActionResponse<IChargeVariable>>
> = {
  'valider-dga':  validerDGAChargeVariableAction,
  'approuver-dg': approuverDGChargeVariableAction,
  'rejeter-dga':  rejeterDGAChargeVariableAction,
  'rejeter-dg':   rejeterDGChargeVariableAction,
  'decaisser':    decaisserChargeVariableAction,
};

export const useActionChargeVariableMutation = () => {
  const invalidateChargeVariableQuery = useInvalidateChargeVariableQuery();

  return useMutation({
    mutationFn: async ({ id, action, dto }: { id: string; action: ActionWorkflow; dto: IWorkflowDecisionDto }) => {
      const result = await ACTION_FN[action](id, dto);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la mise à jour du statut');
      }
      return result.data as IChargeVariable;
    },
    onSuccess: async (_data, vars) => {
      await invalidateChargeVariableQuery();
      toast.success(`Charge variable ${ACTION_LABELS[vars.action]}`);
    },
    onError: (error) => {
      toast.error('Erreur workflow', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
