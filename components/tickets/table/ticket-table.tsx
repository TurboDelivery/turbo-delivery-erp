'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { toast } from 'sonner';
import { Package } from 'lucide-react';

import { Restaurant } from '@/types/models';
import { Ticket } from '@/types/bon-livraison.model';
import { StatutControle } from '@/types/statut-controle.enum';
import useTickets from '@/features/tickets/hooks/use-tickets';
import { useAbility } from '@/hooks/use-ability';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { useTicketAuthentication } from '@/features/tickets/hooks/use-ticket-authentication';
import StatsSection from '@/components/tickets/stats-section';
import { TicketArchivesTable } from './ticket-archives-table';
import { TicketTableFilters } from './ticket-table-filters';
import { TicketTableActions } from './ticket-table-actions';
import { TicketTableExportButton } from './ticket-table-export-button';
import { createTicketColumns, TicketColumnMeta } from './ticket-table-columns';
import { TicketMobileCard } from './ticket-mobile-card';
import ConfirmModal from '@/components/ui/confirm-modal';

interface TicketTableProps {
  restaurants: Restaurant[];
  newTickets: Ticket[];
  newTicketIds: Set<string>;
  livreurOptions: { value: string; label: string }[];
  restaurantOptions: { value: string; label: string }[];
  isCreatingBonLivraison: boolean;
  onSaveNewTicket: (id: string) => void;
  onCancelNewTicket: (id: string) => void;
  onNewTicketChange: (id: string, field: keyof Ticket, value: string) => void;
  onNewTicketPatch: (id: string, patch: Partial<Ticket>) => void;
}

export function TicketTable({ restaurants, newTickets, newTicketIds, livreurOptions, restaurantOptions, isCreatingBonLivraison, onSaveNewTicket, onCancelNewTicket, onNewTicketChange, onNewTicketPatch }: TicketTableProps) {
  const {
    filters,
    setFilter,
    ticketsData,
    isLoading,
    infiniteState,
    mutations: { deleteBonLivraisonMutation, isDeletingBonLivraison, isUpdatingBonLivraison },
    editing,
  } = useTickets(restaurants);

  const ability = useAbility();

  const { authenticatedIds, handleAuthentifier } = useTicketAuthentication();

  const permissions = useMemo(() => ({
    canCreate: ability.can('create', 'Ticket'),
    canUpdate: ability.can('update', 'Ticket'),
    canDelete: ability.can('delete', 'Ticket'),
    canAuthentifier: ability.can('authentifier', 'Ticket'),
    // Admin/direction (manage all) : peut supprimer un ticket QUEL QUE SOIT son statut
    // (y compris V2 validé), là où les autres rôles sont limités aux statuts non figés.
    isAdmin: ability.can('manage', 'all'),
  }), [ability]);

  const [ticketsToDelete, setTicketsToDelete] = useState<string[] | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const activeTab = filters.tab;
  const observerTarget = useInfiniteScroll(infiniteState.fetchNextPage, infiniteState.hasNextPage);
  // Sentinelle dédiée aux cartes mobile (le sentinel desktop est masqué < md et n'intersecte jamais)
  const observerTargetMobile = useInfiniteScroll(infiniteState.fetchNextPage, infiniteState.hasNextPage);
  const allTickets = useMemo(() => [...newTickets, ...ticketsData], [newTickets, ticketsData]);
  const columns = useMemo(() => createTicketColumns(), []);

  const handleDeleteRow = useCallback((id: string) => setTicketsToDelete([id]), []);

  const handleTicketChange = useCallback(
    (id: string, field: keyof Ticket, value: string) => {
      if (newTicketIds.has(id)) onNewTicketChange(id, field, value);
      else editing.handleTicketChange(id, field, value);
    },
    [newTicketIds, onNewTicketChange, editing],
  );

  const handleTicketPatch = useCallback(
    (id: string, patch: Partial<Ticket>) => {
      if (newTicketIds.has(id)) onNewTicketPatch(id, patch);
      else editing.handleTicketPatch(id, patch);
    },
    [newTicketIds, onNewTicketPatch, editing],
  );

  const tableMeta: TicketColumnMeta = useMemo(
    () => ({
      livreurOptions,
      restaurantOptions,
      editingIds: editing.editingIds,
      editedTickets: editing.editedTickets,
      newTicketIds,
      permissions,
      authenticatedIds,
      onTicketChange: handleTicketChange,
      onTicketPatch: handleTicketPatch,
      onSaveNew: onSaveNewTicket,
      onSaveEdit: editing.handleSaveRow,
      onCancelNew: onCancelNewTicket,
      onCancelEdit: editing.handleCancelEditRow,
      onEditRow: editing.handleEditRow,
      onDeleteRow: handleDeleteRow,
      onAuthentifier: handleAuthentifier,
      isSavingNew: isCreatingBonLivraison,
      isSavingEdit: isUpdatingBonLivraison,
      getDisplayTicket: editing.getDisplayTicket,
    }),
    [
      livreurOptions, restaurantOptions, editing, newTicketIds, permissions,
      authenticatedIds, handleTicketChange, handleTicketPatch, onSaveNewTicket,
      onCancelNewTicket, handleDeleteRow, handleAuthentifier, isCreatingBonLivraison, isUpdatingBonLivraison,
    ],
  );

  const table = useReactTable({
    data: allTickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
    meta: tableMeta,
    getRowId: (row) => row.id,
  });

  const MODIFIABLE_STATUTS = new Set<string>([StatutControle.PENDING, StatutControle.TARDIF, StatutControle.REJETE_FRAUDE]);

  const selectedRowIds = useMemo(
    () =>
      table
        .getFilteredSelectedRowModel()
        .rows
        .filter((r) => {
          if (newTicketIds.has(r.id)) return false;
          const statut = r.original.statutControle;
          return !statut || MODIFIABLE_STATUTS.has(statut);
        })
        .map((r) => r.id),
    [table, rowSelection, newTicketIds],
  );

  const colsCount = table.getAllColumns().length;

  const handleConfirmDelete = useCallback(() => {
    if (!ticketsToDelete || ticketsToDelete.length === 0) return;
    for (const id of ticketsToDelete) {
      deleteBonLivraisonMutation(id, {
        onSuccess: () => { if (ticketsToDelete.length === 1) toast.success('Le ticket a été supprimé avec succès.'); },
        onError: () => toast.error('Erreur lors de la suppression du ticket.'),
      });
    }
    setRowSelection({});
    setTicketsToDelete(null);
  }, [ticketsToDelete, deleteBonLivraisonMutation]);

  const handleDeleteRows = useCallback(() => {
    if (selectedRowIds.length === 0) { toast.warning('Aucune ligne sélectionnée'); return; }
    setTicketsToDelete(Array.from(selectedRowIds));
  }, [selectedRowIds]);

  return (
    <div className="min-h-screen p-2">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Mes tickets</h1>
            <p className="text-xs sm:text-sm text-gray-500">Système de suivi des tickets de livraison</p>
          </div>
        </div>
      </div>

      <StatsSection />

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border border-gray-200 overflow-x-auto">
          <button
            onClick={() => setFilter('tab', 'tous')}
            className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base whitespace-nowrap ${activeTab === 'tous' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-600'}`}
          >
            Tous les Tickets
          </button>
          <button
            onClick={() => setFilter('tab', 'archives')}
            className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base whitespace-nowrap ${activeTab === 'archives' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-600'}`}
          >
            Archives
          </button>
        </div>

        {activeTab === 'tous' && (
          <div className="p-4">
            <TicketTableFilters
              search={filters.search}
              livreurId={filters.livreurId}
              restaurantId={filters.restaurantId}
              debut={filters.debut}
              fin={filters.fin}
              livreurOptions={livreurOptions}
              restaurantOptions={restaurantOptions}
              onFilterChange={setFilter}
            />
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-xs sm:text-sm text-gray-600">Total: {infiniteState.totalItems} ticket(s)</p>
              <TicketTableExportButton filters={filters} totalItems={infiniteState.totalItems} isDisabled={isLoading} />
            </div>
            <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
              <div className="max-h-[420px] overflow-y-auto">
                <Table isStriped>
                  <TableHeader>
                    {table.getFlatHeaders().map((header) => (
                      <TableColumn key={header.id} className="text-xs sm:text-sm font-medium whitespace-nowrap">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableColumn>
                    ))}
                  </TableHeader>
                  <TableBody emptyContent={isLoading ? 'Chargement des tickets...' : 'Aucun ticket trouvé.'}>
                    {isLoading
                      ? Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={`skeleton-${i}`}>
                            {Array.from({ length: colsCount }).map((_, j) => (
                              <TableCell key={`skeleton-cell-${j}`} className="h-12">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      : table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={`${row.getIsSelected() ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} className="px-2 py-1 text-xs whitespace-nowrap">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
                <div className="h-0.5" ref={observerTarget}>
                  {infiniteState.isFetchingNextPage && <p className="text-xs text-gray-500 w-full text-center py-2">Chargement des données...</p>}
                </div>
              </div>
            </div>

            {/* Mobile — cartes tactiles (remplace le tableau < md) */}
            <div className="md:hidden space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-72 rounded-xl bg-gray-100 animate-pulse" />)
              ) : table.getRowModel().rows.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">Aucun ticket trouvé.</p>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TicketMobileCard
                    key={row.id}
                    ticket={row.original}
                    meta={tableMeta}
                    isSelected={row.getIsSelected()}
                    onToggleSelect={(value) => row.toggleSelected(value)}
                  />
                ))
              )}
              <div className="h-0.5" ref={observerTargetMobile}>
                {infiniteState.isFetchingNextPage && <p className="text-xs text-gray-500 w-full text-center py-2">Chargement des données...</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'archives' && <TicketArchivesTable restaurantOptions={restaurantOptions} livreurOptions={livreurOptions} />}
      </div>

      {activeTab !== 'archives' && (
        <TicketTableActions
          ticketsData={ticketsData}
          selectedRows={selectedRowIds}
          permissions={permissions}
          isDeletingBonLivraison={isDeletingBonLivraison}
          onDeleteRows={handleDeleteRows}
        />
      )}

      <ConfirmModal
        isOpen={ticketsToDelete !== null}
        onClose={() => setTicketsToDelete(null)}
        title={ticketsToDelete?.length === 1 ? 'Supprimer le ticket' : `Supprimer ${ticketsToDelete?.length ?? 0} ticket(s)`}
        isLoading={isDeletingBonLivraison}
        actions={[
          { label: 'Annuler', variant: 'light', onPress: () => setTicketsToDelete(null) },
          { label: 'Supprimer', color: 'danger', onPress: handleConfirmDelete },
        ]}
      >
        {ticketsToDelete?.length === 1
          ? 'Confirmez-vous la suppression définitive de ce ticket ? Cette action est irréversible.'
          : `Confirmez-vous la suppression de ${ticketsToDelete?.length ?? 0} ticket(s) ? Cette action est irréversible.`}
      </ConfirmModal>
    </div>
  );
}
