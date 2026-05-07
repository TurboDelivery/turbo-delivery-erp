'use client';

import RegularisationPageHeader from './RegularisationPageHeader';
import RegularisationQueue from './RegularisationQueue';
import RegularisationDetail from './RegularisationDetail';
import useRegularisation from '../hooks/use-regularisation';

export default function RegularisationContent() {
  const {
    tickets,
    selectedId,
    selectedTicket,
    isApproving,
    isRejecting,
    setSelectedId,
    handleApprove,
    handleReject,
  } = useRegularisation();

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <RegularisationPageHeader pendingCount={tickets.length} />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <RegularisationQueue
          tickets={tickets}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {selectedTicket ? (
          <RegularisationDetail
            ticket={selectedTicket}
            isApproving={isApproving}
            isRejecting={isRejecting}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ) : (
          <div className="flex-1 w-full flex items-center justify-center rounded-xl border border-gray-200 bg-white py-24">
            <p className="text-sm text-gray-400">Sélectionnez un ticket pour voir les détails.</p>
          </div>
        )}
      </div>
    </div>
  );
}
