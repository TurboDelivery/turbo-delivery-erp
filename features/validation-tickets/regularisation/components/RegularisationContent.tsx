'use client';

import RegularisationPageHeader from './RegularisationPageHeader';
import RegularisationQueue from './RegularisationQueue';
import RegularisationDetail from './RegularisationDetail';
import RegularisationTicketsTable from './RegularisationTicketsTable';
import { RegularisationRecapPanel } from './RegularisationRecapPanel';
import useRegularisation from '../hooks/use-regularisation';
import TicketFilterBar from '@/components/validation-tickets/TicketFilterBar';

export default function RegularisationContent() {
  const {
    tickets,
    filteredTickets,
    filters,
    setFilters,
    livreurOptions,
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

      <TicketFilterBar value={filters} onChange={setFilters} livreurOptions={livreurOptions} />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <RegularisationQueue
          tickets={filteredTickets}
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

      <RegularisationTicketsTable />

      {/* Point par livreur + paiement des régularisations (lot contrôlé → Wave). */}
      <RegularisationRecapPanel />
    </div>
  );
}
