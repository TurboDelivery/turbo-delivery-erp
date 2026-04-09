'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deductionAPI } from '@/features/personnel/apis/deduction.api';
import {
  CreateAbsenceDeductionDTO,
  CreateAvanceDTO,
  CreatePretDTO,
  UpdateAbsenceDeductionDTO,
  UpdateAvanceDTO,
  UpdatePretDTO,
} from '@/features/personnel/schemas/deduction.schema';
import { useInvalidateDeductionQuery } from './index.query';

export const useCreateAvanceMutation = () => {
  const invalidate = useInvalidateDeductionQuery();

  return useMutation({
    mutationFn: (dto: CreateAvanceDTO) => deductionAPI.createAvance(dto),
    onSuccess: async () => {
      await invalidate();
      toast.success('Avance ajoutee avec succes');
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout de l'avance", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useUpdateAvanceMutation = () => {
  const invalidate = useInvalidateDeductionQuery();

  return useMutation({
    mutationFn: ({ deductionId, dto }: { deductionId: string; dto: UpdateAvanceDTO }) =>
      deductionAPI.updateAvance(deductionId, dto),
    onSuccess: async () => {
      await invalidate();
      toast.success('Avance modifiee avec succes');
    },
    onError: (error) => {
      toast.error("Erreur lors de la modification de l'avance", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useCreateAbsenceDeductionMutation = () => {
  const invalidate = useInvalidateDeductionQuery();

  return useMutation({
    mutationFn: (dto: CreateAbsenceDeductionDTO) => deductionAPI.createAbsenceDeduction(dto),
    onSuccess: async () => {
      await invalidate();
      toast.success('Deduction absence ajoutee avec succes');
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout de la deduction", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useUpdateAbsenceDeductionMutation = () => {
  const invalidate = useInvalidateDeductionQuery();

  return useMutation({
    mutationFn: ({ deductionId, dto }: { deductionId: string; dto: UpdateAbsenceDeductionDTO }) =>
      deductionAPI.updateAbsenceDeduction(deductionId, dto),
    onSuccess: async () => {
      await invalidate();
      toast.success('Deduction modifiee avec succes');
    },
    onError: (error) => {
      toast.error('Erreur lors de la modification de la deduction', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useCreatePretMutation = () => {
  const invalidate = useInvalidateDeductionQuery();

  return useMutation({
    mutationFn: (dto: CreatePretDTO) => deductionAPI.createPret(dto),
    onSuccess: async () => {
      await invalidate();
      toast.success('Pret ajoute avec succes');
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout du pret", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useUpdatePretMutation = () => {
  const invalidate = useInvalidateDeductionQuery();

  return useMutation({
    mutationFn: ({ referenceId, dto }: { referenceId: string; dto: UpdatePretDTO }) =>
      deductionAPI.updatePret(referenceId, dto),
    onSuccess: async () => {
      await invalidate();
      toast.success('Pret modifie avec succes');
    },
    onError: (error) => {
      toast.error('Erreur lors de la modification du pret', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useCancelDeductionMutation = () => {
  const invalidate = useInvalidateDeductionQuery();

  return useMutation({
    mutationFn: (deductionId: string) => deductionAPI.cancelDeduction(deductionId),
    onSuccess: async () => {
      await invalidate();
    },
    onError: (error) => {
      toast.error("Erreur lors de l'annulation de la deduction", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
