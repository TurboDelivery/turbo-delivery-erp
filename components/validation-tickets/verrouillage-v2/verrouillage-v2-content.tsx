'use client';

import { VerrouillageV2Stats } from './verrouillage-v2-stats';
import { VerrouillageV2Table } from './verrouillage-v2-table';
import { VerrouillageV2Footer } from './verrouillage-v2-footer';
import { RejectMotifDialog } from './reject-motif-dialog';
import { V2ValideTable } from './v2-valide-table';
import { useVerrouillageV2Content } from '@/features/validation-tickets/verrouillage-v2/hooks/use-verrouillage-v2-content';
import TicketFilterBar from '@/components/validation-tickets/TicketFilterBar';

export function VerrouillageV2Content() {
  const {
    tickets,
    totalElements,
    ticketsV2Valide,
    totalV2Valide,
    isLoadingV2Valide,
    fetchNextV2Valide,
    hasNextV2Valide,
    isFetchingNextV2Valide,
    filters,
    setFilters,
    v2ValideFilters,
    setV2ValideFilters,
    livreurOptions,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    ticketStats,
    isStatsLoading,
    validatingId,
    isValidatingAll,
    isRejecting,
    rejectDialogId,
    setRejectDialogId,
    handleValidate,
    handleReject,
    handleValidateAll,
  } = useVerrouillageV2Content();

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-red-600">Verrouillage V2 — Responsable V&A</h1>
        <p className="text-sm text-gray-500 mt-1">
          Étape 4 — Double passe complète.
        </p>
      </div>

      <VerrouillageV2Stats
        stats={ticketStats}
        isLoading={isStatsLoading}
      />

      <TicketFilterBar value={filters} onChange={setFilters} livreurOptions={livreurOptions} />

      <VerrouillageV2Table
        tickets={tickets}
        totalElements={totalElements}
        isLoading={isLoading}
        validatingId={validatingId}
        onValidate={handleValidate}
        onReject={setRejectDialogId}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />

      <VerrouillageV2Footer
        ticketCount={totalElements}
        isValidating={isValidatingAll}
        onValidateAll={handleValidateAll}
      />

      <TicketFilterBar value={v2ValideFilters} onChange={setV2ValideFilters} livreurOptions={livreurOptions} />

      <V2ValideTable
        tickets={ticketsV2Valide}
        totalElements={totalV2Valide}
        isLoading={isLoadingV2Valide}
        fetchNextPage={fetchNextV2Valide}
        hasNextPage={hasNextV2Valide}
        isFetchingNextPage={isFetchingNextV2Valide}
        onReject={setRejectDialogId}
        rejectingId={rejectDialogId}
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
