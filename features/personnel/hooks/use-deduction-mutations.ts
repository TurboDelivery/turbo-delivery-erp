'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import {
  useCancelDeductionMutation,
  useCreateAbsenceDeductionMutation,
  useCreateAvanceMutation,
  useCreatePretMutation,
  useUpdateAbsenceDeductionMutation,
  useUpdateAvanceMutation,
} from '@/features/personnel/mutations';
import { CreateAbsenceDeductionDTO, CreateAvanceDTO, CreatePretDTO } from '@/features/personnel/schemas/deduction.schema';
import { IDeduction } from '@/features/personnel/types/deduction.types';
interface ModalActions<T> {
  open: (item?: T | null) => void;
}

interface DeductionModals {
  absenceModal: ModalActions<IDeduction>;
  advanceModal: ModalActions<IDeduction>;
  pretModal: ModalActions<IDeduction>;
}

export function useDeductionMutations() {
  const createAbsenceMutation = useCreateAbsenceDeductionMutation();
  const updateAbsenceMutation = useUpdateAbsenceDeductionMutation();
  const createAvanceMutation = useCreateAvanceMutation();
  const updateAvanceMutation = useUpdateAvanceMutation();
  const createPretMutation = useCreatePretMutation();
  const cancelMutation = useCancelDeductionMutation();

  const submitAbsence = useCallback(
    async ({ mode, id, dto }: { mode: 'create' | 'update'; id?: string; dto: CreateAbsenceDeductionDTO }) => {
      if (mode === 'update') {
        if (!id) throw new Error("L'identifiant de la deduction est requis pour la modification.");
        await updateAbsenceMutation.mutateAsync({ deductionId: id, dto });
        return;
      }
      await createAbsenceMutation.mutateAsync(dto);
    },
    [createAbsenceMutation, updateAbsenceMutation],
  );

  const submitAvance = useCallback(
    async ({ mode, id, dto }: { mode: 'create' | 'update'; id?: string; dto: CreateAvanceDTO }) => {
      if (mode === 'update') {
        if (!id) throw new Error("L'identifiant de la deduction est requis pour la modification.");
        await updateAvanceMutation.mutateAsync({ deductionId: id, dto });
        return;
      }
      await createAvanceMutation.mutateAsync(dto);
    },
    [createAvanceMutation, updateAvanceMutation],
  );

  const submitPret = useCallback(
    async ({ mode, dto }: { mode: 'create' | 'update'; dto: CreatePretDTO }) => {
      if (mode === 'update') {
        toast.info('La modification des prets est temporairement desactivee.');
        return;
      }
      await createPretMutation.mutateAsync(dto);
    },
    [createPretMutation],
  );

  const cancelDeduction = useCallback(
    async (deduction: IDeduction) => {
      if (deduction.status === 'CANCELLED') {
        toast.info('Deduction deja annulee.');
        return;
      }

      await cancelMutation.mutateAsync(deduction.id);
      toast.success('Deduction annulee avec succes.');
    },
    [cancelMutation],
  );

  const editDeduction = useCallback((deduction: IDeduction, modals: DeductionModals) => {
    if (deduction.typeDeduction === 'ABSENCE' || deduction.typeDeduction === 'RETARD') {
      modals.absenceModal.open(deduction);
      return;
    }
    if (deduction.typeDeduction === 'AVANCE') {
      modals.advanceModal.open(deduction);
      return;
    }
    if (deduction.typeDeduction === 'PRET') {
      toast.info('La modification des prets est temporairement desactivee.');
      return;
    }
    toast.info('Type de deduction non gere.');
  }, []);

  return { submitAbsence, submitAvance, submitPret, cancelDeduction, editDeduction };
}
