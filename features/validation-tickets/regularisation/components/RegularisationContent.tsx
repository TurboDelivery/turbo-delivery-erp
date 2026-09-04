'use client';

import { Card, EmptyState } from '@heroui-v3/react';
import RegularisationPageHeader from './RegularisationPageHeader';
import RegularisationQueue from './RegularisationQueue';
import RegularisationDetail from './RegularisationDetail';
import RegularisationTicketsTable from './RegularisationTicketsTable';
import { RegularisationRecapPanel } from './RegularisationRecapPanel';
import useRegularisation from '../hooks/use-regularisation';
import TicketFilterBar from '@/components/validation-tickets/TicketFilterBar';

export default function RegularisationContent() {
  const {
    totalEnAttente,
    tickets,
    filteredTickets,
    filters,
    setFilters,
    livreurOptions,
    selectedId,
    selectedTicket,
    isError,
    isFetching,
    refetch,
    isApproving,
    isRejecting,
    setSelectedId,
    handleApprove,
    handleReject,
  } = useRegularisation();

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <RegularisationPageHeader pendingCount={totalEnAttente} />

      <TicketFilterBar value={filters} onChange={setFilters} livreurOptions={livreurOptions} />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <RegularisationQueue
          tickets={filteredTickets}
          selectedId={selectedId}
          onSelect={setSelectedId}
          isError={isError}
          isFetching={isFetching}
          onReessayer={() => refetch()}
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
          /*
           * La zone de detail au repos etait une div habillee a la main (bordure, fond et
           * rayon recopies a cote du theme). Ces valeurs recopiees derivent des que le
           * theme bouge, et l'ecart ne se voit qu'une fois l'ecran ouvert : l'operateur
           * se retrouve avec un cadre qui ne ressemble plus au reste de la page. `Card`
           * porte sa surface et son rayon, `EmptyState` la typographie d'attente.
           */
          <Card className="flex-1 w-full items-center justify-center py-24">
            <EmptyState>Sélectionnez un ticket pour voir les détails.</EmptyState>
          </Card>
        )}
      </div>

      <RegularisationTicketsTable />

      {/* Point par livreur + paiement des régularisations (lot contrôlé → Wave). */}
      <RegularisationRecapPanel />
    </div>
  );
}
