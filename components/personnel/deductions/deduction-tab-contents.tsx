'use client';

import React, { useCallback } from 'react';

import DeductionStatsOverview from '@/components/personnel/deductions/stats/deduction-stats-overview';
import DeductionAddBar from '@/components/personnel/deductions/deduction-add-bar';
import { DeductionTable } from '@/components/personnel/deductions/deductions/deduction-table';
import AbsenceModal from '@/components/personnel/deductions/modals/absence-modal';
import AvanceSalaireModal from '@/components/personnel/deductions/modals/avance-salaire-modal';
import PretModal from '@/components/personnel/deductions/modals/pret-modal';
import { useModalState } from '@/hooks/use-modal-state';
import { useDeductionMutations } from '@/features/personnel/hooks/use-deduction-mutations';
import { IDeduction } from '@/features/personnel/types/deduction.types';

function DeductionTabContents() {
  const absenceModal = useModalState<IDeduction>();
  const advanceModal = useModalState<IDeduction>();
  const pretModal = useModalState<IDeduction>();

  const { submitAbsence, submitAvance, submitPret, cancelDeduction, editDeduction } = useDeductionMutations();

  const handleEdit = useCallback(
    (deduction: IDeduction) => editDeduction(deduction, { absenceModal, advanceModal, pretModal }),
    [editDeduction, absenceModal, advanceModal, pretModal],
  );

  return (
    <div className="space-y-8">
      <DeductionStatsOverview />
      <DeductionAddBar onAddAbsence={absenceModal.open} onAddAdvance={advanceModal.open} onAddLoan={pretModal.open} />
      <DeductionTable onEditDeduction={handleEdit} onCancelDeduction={cancelDeduction} />
      <AbsenceModal isOpen={absenceModal.isOpen} onClose={absenceModal.close} deduction={absenceModal.selected} onSubmit={submitAbsence} />
      <AvanceSalaireModal isOpen={advanceModal.isOpen} onClose={advanceModal.close} deduction={advanceModal.selected} onSubmit={submitAvance} />
      <PretModal isOpen={pretModal.isOpen} onClose={pretModal.close} deduction={pretModal.selected} onSubmit={submitPret} />
    </div>
  );
}

export default DeductionTabContents;
