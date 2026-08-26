'use client';

import React, { useCallback } from 'react';

import DeductionStatsOverview from '@/components/personnel/deductions/stats/deduction-stats-overview';
import DeductionAddBar from '@/components/personnel/deductions/deduction-add-bar';
import { DeductionTable } from '@/components/personnel/deductions/deductions/deduction-table';
import AbsenceModal from '@/components/personnel/deductions/modals/absence-modal';
import AvanceSalaireModal from '@/components/personnel/deductions/modals/avance-salaire-modal';
import PretModal from '@/components/personnel/deductions/modals/pret-modal';
import ConfirmModal from '@/components/ui/confirm-modal';
import { useModalState } from '@/hooks/use-modal-state';
import { useDeductionMutations } from '@/features/personnel/hooks/use-deduction-mutations';
import { IDeduction } from '@/features/personnel/types/deduction.types';

function DeductionTabContents() {
  const absenceModal = useModalState<IDeduction>();
  const advanceModal = useModalState<IDeduction>();
  const pretModal = useModalState<IDeduction>();
  const deleteModal = useModalState<IDeduction>();

  const { submitAbsence, submitAvance, submitPret, cancelDeduction, supprimerDeduction, isSupprimerPending, editDeduction } = useDeductionMutations();

  const handleEdit = useCallback(
    (deduction: IDeduction) => editDeduction(deduction, { absenceModal, advanceModal, pretModal }),
    [editDeduction, absenceModal, advanceModal, pretModal],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteModal.selected) return;
    await supprimerDeduction(deleteModal.selected);
    deleteModal.close();
  }, [deleteModal, supprimerDeduction]);

  return (
    <div className="space-y-8">
      <DeductionStatsOverview />
      <DeductionAddBar onAddAbsence={absenceModal.open} onAddAdvance={advanceModal.open} onAddLoan={pretModal.open} />
      <DeductionTable onEditDeduction={handleEdit} onCancelDeduction={cancelDeduction} onDeleteDeduction={deleteModal.open} />
      <AbsenceModal isOpen={absenceModal.isOpen} onClose={absenceModal.close} deduction={absenceModal.selected} onSubmit={submitAbsence} />
      <AvanceSalaireModal isOpen={advanceModal.isOpen} onClose={advanceModal.close} deduction={advanceModal.selected} onSubmit={submitAvance} />
      <PretModal isOpen={pretModal.isOpen} onClose={pretModal.close} deduction={pretModal.selected} onSubmit={submitPret} />
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        title="Supprimer la déduction"
        isLoading={isSupprimerPending}
        actions={[
          { label: 'Annuler', variant: 'light', onPress: deleteModal.close },
          { label: 'Supprimer', color: 'danger', onPress: handleConfirmDelete },
        ]}
      >
        Confirmez-vous la suppression définitive de cette déduction ? Cette action est irréversible.
      </ConfirmModal>
    </div>
  );
}

export default DeductionTabContents;
