'use client';

import { useMutation } from '@tanstack/react-query';
import { chargeVariableAPI } from '../apis/charge-variable.api';
import { useInvalidateChargeVariableQuery } from './index-charge-variable.query';
import { IChargeVariable, IChargeVariableCreateDTO, IChargeVariableUpdateDTO, IWorkflowDecisionDto } from '../types/charge-variable.type';
import { toast } from 'sonner';

function buildChargeVariableFormData(data: IChargeVariableCreateDTO, file?: File | null): FormData {
  const fd = new FormData();
  fd.append('designation', data.designation);
  fd.append('categorieId', data.categorieId);
  if (data.cyclePaiement) fd.append('cyclePaiement', data.cyclePaiement);
  fd.append('montant', String(data.montant));
  if (data.echeanceJour != null) fd.append('echeanceJour', String(data.echeanceJour));
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
      return chargeVariableAPI.ajouterChargeVariableFormData(fd);
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
      return chargeVariableAPI.modifierChargeVariableFormData(id, fd);
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
      await chargeVariableAPI.supprimerChargeVariable(id);
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
  'valider-dga': 'visée par le DGA',
  'approuver-dg': 'approuvée par le DG',
  'rejeter-dga': 'rejetée par le DGA',
  'rejeter-dg': 'rejetée par le DG',
  decaisser: 'décaissée',
};

const ACTION_FN: Record<ActionWorkflow, (id: string, dto: IWorkflowDecisionDto) => Promise<IChargeVariable>> = {
  'valider-dga': (id, dto) => chargeVariableAPI.validerDGAChargeVariable(id, dto),
  'approuver-dg': (id, dto) => chargeVariableAPI.approuverDGChargeVariable(id, dto),
  'rejeter-dga': (id, dto) => chargeVariableAPI.rejeterDGAChargeVariable(id, dto),
  'rejeter-dg': (id, dto) => chargeVariableAPI.rejeterDGChargeVariable(id, dto),
  decaisser: (id, dto) => chargeVariableAPI.decaisserChargeVariable(id, dto),
};

export const useActionChargeVariableMutation = () => {
  const invalidateChargeVariableQuery = useInvalidateChargeVariableQuery();

  return useMutation({
    mutationFn: ({ id, action, dto }: { id: string; action: ActionWorkflow; dto: IWorkflowDecisionDto }) => {
      return ACTION_FN[action](id, dto);
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
