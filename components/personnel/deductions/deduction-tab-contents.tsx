'use client';

import React, { useState } from 'react';

import DeductionStatsOverview from '@/components/personnel/deductions/stats/deduction-stats-overview';
import DeductionAddBar from '@/components/personnel/deductions/deduction-add-bar';
import { AbsenceTable } from '@/components/personnel/deductions/absences/absence-table';
import AbsenceModal from '@/components/personnel/deductions/modals/absence-modal';
import AvanceSalaireModal from '@/components/personnel/deductions/modals/avance-salaire-modal';
import { IAbsence } from '@/features/personnel/types/absence.types';

function DeductionTabContents() {
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<IAbsence | null>(null);

  const handleOpenCreateAbsenceModal = () => {
    setSelectedAbsence(null);
    setIsAbsenceModalOpen(true);
  };

  const handleCloseAbsenceModal = () => {
    setIsAbsenceModalOpen(false);
    setSelectedAbsence(null);
  };

  const handleOpenAdvanceModal = () => {
    setIsAdvanceModalOpen(true);
  };

  const handleCloseAdvanceModal = () => {
    setIsAdvanceModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <DeductionStatsOverview />
      <DeductionAddBar onAddAbsence={handleOpenCreateAbsenceModal} onAddAdvance={handleOpenAdvanceModal} />
      <AbsenceTable />
      <AbsenceModal isOpen={isAbsenceModalOpen} onClose={handleCloseAbsenceModal} absence={selectedAbsence} />
      <AvanceSalaireModal isOpen={isAdvanceModalOpen} onClose={handleCloseAdvanceModal} />
    </div>
  );
}

export default DeductionTabContents;
