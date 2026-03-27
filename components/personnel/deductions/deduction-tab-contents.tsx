'use client';

import React, { useState } from 'react';

import DeductionStatsOverview from '@/components/personnel/deductions/stats/deduction-stats-overview';
import DeductionAddBar from '@/components/personnel/deductions/deduction-add-bar';
import { DeductionTable } from '@/components/personnel/deductions/deductions/deduction-table';
import AbsenceModal from '@/components/personnel/deductions/modals/absence-modal';
import AvanceSalaireModal from '@/components/personnel/deductions/modals/avance-salaire-modal';
import PretModal from '@/components/personnel/deductions/modals/pret-modal';
import { IDeduction } from '@/features/personnel/types/deduction.types';
import { toast } from 'sonner';

function DeductionTabContents() {
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isPretModalOpen, setIsPretModalOpen] = useState(false);
  const [selectedAbsenceDeduction, setSelectedAbsenceDeduction] = useState<IDeduction | null>(null);
  const [selectedAdvanceDeduction, setSelectedAdvanceDeduction] = useState<IDeduction | null>(null);
  const [selectedPretDeduction, setSelectedPretDeduction] = useState<IDeduction | null>(null);

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
      setSelectedPretDeduction(deduction);
      setIsPretModalOpen(true);
      return;
    }

    toast.info('Type de deduction non gere.');
  };

  const handleDeleteDeduction = (deduction: IDeduction) => {
    if (deduction.typeDeduction === 'PRET') {
      toast.info('Suppression indisponible pour les prets pour le moment.');
      return;
    }

    toast.info('Suppression a brancher sur endpoint des que disponible.');
  };

  return (
    <div className="space-y-8">
      <DeductionStatsOverview />
      <DeductionAddBar onAddAbsence={handleOpenCreateAbsenceModal} onAddAdvance={handleOpenAdvanceModal} onAddLoan={handleOpenPretModal} />
      <DeductionTable onEditDeduction={handleEditDeduction} onDeleteDeduction={handleDeleteDeduction} />
      <AbsenceModal isOpen={isAbsenceModalOpen} onClose={handleCloseAbsenceModal} deduction={selectedAbsenceDeduction} />
      <AvanceSalaireModal isOpen={isAdvanceModalOpen} onClose={handleCloseAdvanceModal} deduction={selectedAdvanceDeduction} />
      <PretModal isOpen={isPretModalOpen} onClose={handleClosePretModal} deduction={selectedPretDeduction} />
    </div>
  );
}

export default DeductionTabContents;
