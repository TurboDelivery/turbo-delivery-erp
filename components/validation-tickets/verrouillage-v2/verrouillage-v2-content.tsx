'use client';

import { VerrouillageV2Stats } from './verrouillage-v2-stats';
import { VerrouillageV2Table } from './verrouillage-v2-table';
import { VerrouillageV2Footer } from './verrouillage-v2-footer';
import { RejectMotifDialog } from './reject-motif-dialog';
import { useVerrouillageV2Content } from '@/features/validation-tickets/verrouillage-v2/hooks/use-verrouillage-v2-content';

export function VerrouillageV2Content() {
  const {
    tickets,
    isLoading,
    validatingId,
    isValidating,
    isRejecting,
    rejectDialogId,
    setRejectDialogId,
    creneauActif,
    handleValidate,
    handleReject,
    handleValidateAll,
  } = useVerrouillageV2Content();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Chargement des tickets...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      <div>
        <h1 className="text-2xl font-bold text-red-600">Verrouillage V2 — Responsable V&A</h1>
        <p className="text-sm text-gray-500 mt-1">
          Étape 4 — Double passe complète.
        </p>
      </div>

      <VerrouillageV2Stats
        tickets={tickets}
        ticketsPending={creneauActif?.nbTicketsPending ?? 0}
      />

      <VerrouillageV2Table
        tickets={tickets}
        validatingId={validatingId}
        onValidate={handleValidate}
        onReject={setRejectDialogId}
      />

      <VerrouillageV2Footer
        ticketCount={tickets.length}
        isValidating={isValidating}
        onValidateAll={handleValidateAll}
      />

      <RejectMotifDialog
        open={rejectDialogId !== null}
        ticketId={rejectDialogId}
        isRejecting={isRejecting}
        onConfirm={handleReject}
        onClose={() => setRejectDialogId(null)}
      />
    </div>
  );
}
