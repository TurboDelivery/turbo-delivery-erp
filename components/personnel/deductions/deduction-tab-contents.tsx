'use client';

import React, { useState } from 'react';

import DeductionStatsOverview from '@/components/personnel/deductions/stats/deduction-stats-overview';
import DeductionAddBar from '@/components/personnel/deductions/deduction-add-bar';
import { DeductionTable } from '@/components/personnel/deductions/deductions/deduction-table';
import AbsenceModal from '@/components/personnel/deductions/modals/absence-modal';
import AvanceSalaireModal from '@/components/personnel/deductions/modals/avance-salaire-modal';
import PretModal from '@/components/personnel/deductions/modals/pret-modal';
import {
  useCreateAbsenceDeductionMutation,
  useCreateAvanceMutation,
  useCreatePretMutation,
  useUpdateAbsenceDeductionMutation,
  useUpdateAvanceMutation,
  useUpdatePretMutation,
} from '@/features/personnel/mutations';
import { CreateAbsenceDeductionDTO, CreateAvanceDTO, CreatePretDTO } from '@/features/personnel/schemas/deduction.schema';
import { IDeduction } from '@/features/personnel/types/deduction.types';
import { toast } from 'sonner';

function DeductionTabContents() {
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isPretModalOpen, setIsPretModalOpen] = useState(false);
  const [selectedAbsenceDeduction, setSelectedAbsenceDeduction] = useState<IDeduction | null>(null);
  const [selectedAdvanceDeduction, setSelectedAdvanceDeduction] = useState<IDeduction | null>(null);
  const [selectedPretDeduction, setSelectedPretDeduction] = useState<IDeduction | null>(null);
  const createAbsenceMutation = useCreateAbsenceDeductionMutation();
  const updateAbsenceMutation = useUpdateAbsenceDeductionMutation();
  const createAvanceMutation = useCreateAvanceMutation();
  const updateAvanceMutation = useUpdateAvanceMutation();
  const createPretMutation = useCreatePretMutation();
  const updatePretMutation = useUpdatePretMutation();

  const handleOpenCreateAbsenceModal = () => {
    setSelectedAbsenceDeduction(null);
    setIsAbsenceModalOpen(true);
  };

  const handleCloseAbsenceModal = () => {
    setIsAbsenceModalOpen(false);
    setSelectedAbsenceDeduction(null);
  };

  const handleOpenAdvanceModal = () => {
    setSelectedAdvanceDeduction(null);
    setIsAdvanceModalOpen(true);
  };

  const handleCloseAdvanceModal = () => {
    setIsAdvanceModalOpen(false);
    setSelectedAdvanceDeduction(null);
  };

  const handleOpenPretModal = () => {
    setSelectedPretDeduction(null);
    setIsPretModalOpen(true);
  };

  const handleClosePretModal = () => {
    setIsPretModalOpen(false);
    setSelectedPretDeduction(null);
  };

  const handleEditDeduction = (deduction: IDeduction) => {
    if (deduction.typeDeduction === 'ABSENCE' || deduction.typeDeduction === 'RETARD') {
      setSelectedAbsenceDeduction(deduction);
      setIsAbsenceModalOpen(true);
      return;
    }

    if (deduction.typeDeduction === 'AVANCE') {
      setSelectedAdvanceDeduction(deduction);
      setIsAdvanceModalOpen(true);
      return;
    }

    if (deduction.typeDeduction === 'PRET') {
      toast.info('La modification des prets est temporairement desactivee.');
      return;
    }

    toast.info('Type de deduction non gere.');
  };

  const handleCancelDeduction = async (deduction: IDeduction) => {
    if (deduction.status === 'CANCELLED') {
      toast.info('Deduction deja annulee.');
      return;
    }

    try {
      if (deduction.typeDeduction === 'PRET') {
        const referenceId = deduction.referenceId || deduction.id;
        await updatePretMutation.mutateAsync({ referenceId, dto: { status: 'CANCELLED' } });
      } else if (deduction.typeDeduction === 'AVANCE') {
        await updateAvanceMutation.mutateAsync({ deductionId: deduction.id, dto: { status: 'CANCELLED' } });
      } else {
        await updateAbsenceMutation.mutateAsync({ deductionId: deduction.id, dto: { status: 'CANCELLED' } });
      }

      toast.success('Deduction annulee avec succes.');
    } catch (error) {
      toast.error("Impossible d'annuler la deduction", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  };

  const handleSubmitAbsence = async ({ mode, id, dto }: { mode: 'create' | 'update'; id?: string; dto: CreateAbsenceDeductionDTO }) => {
    if (mode === 'update') {
      if (!id) {
        throw new Error("L'identifiant de la deduction est requis pour la modification.");
      }

      await updateAbsenceMutation.mutateAsync({ deductionId: id, dto });
      return;
    }

    await createAbsenceMutation.mutateAsync(dto);
  };

  const handleSubmitAvance = async ({ mode, id, dto }: { mode: 'create' | 'update'; id?: string; dto: CreateAvanceDTO }) => {
    if (mode === 'update') {
      if (!id) {
        throw new Error("L'identifiant de la deduction est requis pour la modification.");
      }

      await updateAvanceMutation.mutateAsync({ deductionId: id, dto });
      return;
    }

    await createAvanceMutation.mutateAsync(dto);
  };

  const handleSubmitPret = async ({ mode, dto }: { mode: 'create' | 'update'; dto: CreatePretDTO }) => {
    if (mode === 'update') {
      toast.info('La modification des prets est temporairement desactivee.');
      return;
    }

    await createPretMutation.mutateAsync(dto);
  };

  return (
    <div className="space-y-8">
      <DeductionStatsOverview />
      <DeductionAddBar onAddAbsence={handleOpenCreateAbsenceModal} onAddAdvance={handleOpenAdvanceModal} onAddLoan={handleOpenPretModal} />
      <DeductionTable onEditDeduction={handleEditDeduction} onCancelDeduction={handleCancelDeduction} />
      <AbsenceModal isOpen={isAbsenceModalOpen} onClose={handleCloseAbsenceModal} deduction={selectedAbsenceDeduction} onSubmit={handleSubmitAbsence} />
      <AvanceSalaireModal isOpen={isAdvanceModalOpen} onClose={handleCloseAdvanceModal} deduction={selectedAdvanceDeduction} onSubmit={handleSubmitAvance} />
      <PretModal isOpen={isPretModalOpen} onClose={handleClosePretModal} deduction={selectedPretDeduction} onSubmit={handleSubmitPret} />
    </div>
  );
}

export default DeductionTabContents;
