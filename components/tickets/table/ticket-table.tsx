'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { v4 as uuidv4 } from 'uuid';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { Package, Plus } from 'lucide-react';

import { Restaurant, User } from '@/types/models';
import { Ticket } from '@/types/bon-livraison.model';
import useTickets from '@/features/tickets/hooks/use-tickets';
import { useAbility } from '@/hooks/use-ability';
import { useLivreurs } from '@/features/tickets/hooks/use-livreurs';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import StatsSection from '@/components/tickets/stats-section';
import TicketTabLivreur from '@/components/tickets/tabs/ticket-tab-livreur';
import { TicketTableFilters } from './ticket-table-filters';
import { TicketTableActions } from './ticket-table-actions';
import { TicketTableExportButton } from './ticket-table-export-button';
import { createTicketColumns, TicketColumnMeta } from './ticket-table-columns';
import ConfirmModal from '@/components/ui/confirm-modal';
import { applyTicketPatch, getRestaurantInfo } from '@/features/tickets/utils/commission.utils';

interface TicketTableProps {
  restaurants: Restaurant[];
  profile: User | null;
}

export function TicketTable({ restaurants, profile }: TicketTableProps) {
  const {
    filters,
    setFilter,
    ticketsData,
    isLoading,
    infiniteState,
    mutations: { createBonLivraisonMutation, isCreatingBonLivraison, deleteBonLivraisonMutation, isDeletingBonLivraison, updateBonLivraisonMutation, isUpdatingBonLivraison },
    state: { handleEditRow, editingIds, handleCancelEditRow, editedTickets, setEditedTickets },
  } = useTickets();
  const { livreurs } = useLivreurs();
  const ability = useAbility();

  const [newTickets, setNewTickets] = useState<Ticket[]>([]);
  const [authenticatedIds, setAuthenticatedIds] = useState<Set<string>>(new Set());
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [insertCount, setInsertCount] = useState<number>(1);
  const [insertLivreurId, setInsertLivreurId] = useState<string>('');
  const [insertRestaurantId, setInsertRestaurantId] = useState<string>('');
  const [insertDate, setInsertDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const observerTarget = useInfiniteScroll(infiniteState.fetchNextPage, infiniteState.hasNextPage);

  const activeTab = filters.tab;

  // Options
  const validLivreurs = useMemo(() => livreurs.filter((l) => l.prenoms && l.nom), [livreurs]);
  const livreurOptions = useMemo(() => validLivreurs.map((l) => ({ value: l.id, label: `${l.prenoms} ${l.nom}` })), [validLivreurs]);
  const restaurantOptions = useMemo(() => restaurants.map((r) => ({ value: r.id, label: r.nomEtablissement })), [restaurants]);

  // Permissions
  const role = profile?.role?.libelle?.toLowerCase();
  const permissions = useMemo(() => {
    const isRestrictedRole = role === 'standard' || role === "centrale d'appel" || role === 'comptable';
    return {
      canCreate: true,
      canUpdate: !isRestrictedRole,
      canDelete: !isRestrictedRole,
      canSeeExternal: isRestrictedRole,
      canAuthentifier: ability.can('authentifier', 'Ticket'),
    };
  }, [role, ability]);

  // Commission patch wrapper
  const patchTicket = useCallback(
    (ticket: Ticket, patch: Partial<Ticket>): Ticket => applyTicketPatch(ticket, patch, restaurants),
    [restaurants],
  );

  // Handlers
  const handleTicketChange = useCallback(
    (id: string, field: keyof Ticket, value: string) => {
      const isNewTicket = newTickets.some((t) => t.id === id);
      if (isNewTicket) {
        setNewTickets((prev) => prev.map((t) => (t.id === id ? patchTicket(t, { [field]: value }) : t)));
      } else {
        const base = editedTickets.get(id) ?? ticketsData.find((t) => t.id === id);
        if (base) setEditedTickets((prev) => new Map(prev).set(id, patchTicket(base, { [field]: value })));
      }
    },
    [newTickets, editedTickets, ticketsData, patchTicket, setEditedTickets],
  );

  const handleTicketPatch = useCallback(
    (id: string, patch: Partial<Ticket>) => {
      const isNewTicket = newTickets.some((t) => t.id === id);
      if (isNewTicket) {
        setNewTickets((prev) => prev.map((t) => (t.id === id ? patchTicket(t, patch) : t)));
        return;
      }
      setEditedTickets((prev) => {
        const base = prev.get(id) ?? ticketsData.find((t) => t.id === id);
        if (!base) return prev;
        return new Map(prev).set(id, patchTicket(base, patch));
      });
    },
    [newTickets, ticketsData, patchTicket, setEditedTickets],
  );

  const getDisplayTicket = useCallback(
    (ticket: Ticket): Ticket => {
      if (!editingIds.has(ticket.id)) return ticket;
      return editedTickets.get(ticket.id) ?? ticket;
    },
    [editingIds, editedTickets],
  );

  const handleSaveNewTicket = useCallback(
    (id: string) => {
      const ticket = newTickets.find((t) => t.id === id);
      if (!ticket) return;
      createBonLivraisonMutation(
        { ticket, restaurant: getRestaurantInfo(ticket.restaurantId, restaurants) },
        { onSuccess: () => setNewTickets((prev) => prev.filter((t) => t.id !== id)) },
      );
    },
    [newTickets, createBonLivraisonMutation, restaurants],
  );

  const handleSaveRow = useCallback(
    (id: string) => {
      const ticket = editedTickets.get(id) ?? ticketsData.find((t) => t.id === id);
      if (!ticket) return;
      updateBonLivraisonMutation(
        { ticketId: id, ticket, restaurant: getRestaurantInfo(ticket.restaurantId, restaurants) },
        {
          onSuccess: () => {
            setEditedTickets((prev) => { const m = new Map(prev); m.delete(id); return m; });
            handleCancelEditRow(id);
          },
        },
      );
    },
    [editedTickets, ticketsData, updateBonLivraisonMutation, setEditedTickets, handleCancelEditRow, restaurants],
  );

  const handleCancelNewTicket = useCallback((id: string) => setNewTickets((prev) => prev.filter((t) => t.id !== id)), []);

  const handleAuthentifier = useCallback((id: string) => {
    setAuthenticatedIds((prev) => new Set(prev).add(id));
  }, []);

  const handleInsert = useCallback(() => {
    if (insertCount <= 0) return;
    const tickets: Ticket[] = Array.from({ length: insertCount }).map(() => {
      const id = uuidv4();
      const livreurOption = livreurOptions.find((l) => l.value === insertLivreurId);
      const restaurantOption = restaurantOptions.find((r) => r.value === insertRestaurantId);
      return {
        id,
        reference: '',
        livreurId: insertLivreurId,
        livreur: livreurOption?.label ?? '',
        restaurantId: insertRestaurantId,
        restaurant: restaurantOption?.label ?? '',
        montantCommande: '',
        montantLivraison: '',
        coutLivraison: '',
        date: insertDate || new Date().toISOString().split('T')[0],
        heure: new Date().toLocaleTimeString('fr-FR'),
        isNew: true,
        isEditing: true,
        statut: 'TERMINE',
      };
    });
    setNewTickets((prev) => [...tickets, ...prev]);
  }, [insertCount, insertLivreurId, insertRestaurantId, insertDate, livreurOptions, restaurantOptions]);

  // Combine new + existing tickets for the table
  const allTickets = useMemo(() => [...newTickets, ...ticketsData], [newTickets, ticketsData]);
  const newTicketIds = useMemo(() => new Set(newTickets.map((t) => t.id)), [newTickets]);

  // Selection state via React Table
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Columns
  const columns = useMemo(() => createTicketColumns(), []);

  // Single row delete handlers
  const handleDeleteRow = useCallback((id: string) => {
    setTicketToDelete(id);
  }, []);

  // Table meta
  const tableMeta: TicketColumnMeta = useMemo(
    () => ({
      livreurOptions,
      restaurantOptions,
      editingIds,
      editedTickets,
      newTicketIds,
      permissions,
      authenticatedIds,
      onTicketChange: handleTicketChange,
      onTicketPatch: handleTicketPatch,
      onSaveNew: handleSaveNewTicket,
      onSaveEdit: handleSaveRow,
      onCancelNew: handleCancelNewTicket,
      onCancelEdit: handleCancelEditRow,
      onEditRow: handleEditRow,
      onDeleteRow: handleDeleteRow,
      onAuthentifier: handleAuthentifier,
      isSavingNew: isCreatingBonLivraison,
      isSavingEdit: isUpdatingBonLivraison,
      getDisplayTicket,
    }),
    [
      livreurOptions,
      restaurantOptions,
      editingIds,
      editedTickets,
      newTicketIds,
      permissions,
      authenticatedIds,
      handleTicketChange,
      handleTicketPatch,
      handleSaveNewTicket,
      handleSaveRow,
      handleCancelNewTicket,
      handleCancelEditRow,
      handleEditRow,
      handleDeleteRow,
      handleAuthentifier,
      isCreatingBonLivraison,
      isUpdatingBonLivraison,
      getDisplayTicket,
    ],
  );

  const table = useReactTable({
    data: allTickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
    meta: tableMeta,
    getRowId: (row) => row.id,
  });

  const selectedRowIds = table
    .getFilteredSelectedRowModel()
    .rows.map((r) => r.id)
    .filter((id) => !newTicketIds.has(id));

  const colsCount = table.getAllColumns().length;

  const handleConfirmDelete = useCallback(() => {
    if (!ticketToDelete) return;
    deleteBonLivraisonMutation(ticketToDelete, {
      onSuccess: () => toast.success('Le ticket a été supprimé avec succès.'),
      onError: () => toast.error('Erreur lors de la suppression du ticket.'),
    });
    setTicketToDelete(null);
  }, [ticketToDelete, deleteBonLivraisonMutation]);

  // Delete handlers
  const handleDeleteRows = useCallback(async () => {
    if (selectedRowIds.length === 0) {
      toast.warning('Aucune ligne sélectionnée');
      return;
    }
    const confirm = window.confirm(`Supprimer ${selectedRowIds.length} ticket(s) ?`);
    if (!confirm) return;
    const idsToDelete = Array.from(selectedRowIds);
    try {
      for (const id of idsToDelete) {
        deleteBonLivraisonMutation(id);
      }
      setNewTickets((prev) => prev.filter((t) => !idsToDelete.includes(t.id)));
      setRowSelection({});
    } catch (error) {
      console.error(error);
      toast.error('La suppression a échoué — aucune modification appliquée');
    }
  }, [selectedRowIds, deleteBonLivraisonMutation]);

  return (
    <div className="min-h-screen p-2">
      {/* Header */}
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

      {/* Insert bar */}
      <div className="w-full my-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          <div className="w-full">
            <label className="block text-xs mb-1">Restaurant</label>
            <Select
              options={restaurantOptions}
              value={restaurantOptions.find((o) => o.value === insertRestaurantId) ?? null}
              onChange={(opt) => setInsertRestaurantId(opt?.value ?? '')}
              placeholder="Restaurant"
              isClearable
              className="text-xs w-full"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({ ...base, minHeight: '36px', height: '36px', width: '100%' }),
                valueContainer: (base) => ({ ...base, height: '36px', padding: '0 8px' }),
                indicatorsContainer: (base) => ({ ...base, height: '36px' }),
              }}
            />
          </div>
          <div className="w-full">
            <label className="block text-xs mb-1">Livreur</label>
            <Select
              options={livreurOptions}
              value={livreurOptions.find((o) => o.value === insertLivreurId) ?? null}
              onChange={(opt) => setInsertLivreurId(opt?.value ?? '')}
              placeholder="Livreur"
              isClearable
              className="text-xs w-full"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({ ...base, minHeight: '36px', height: '36px', width: '100%' }),
                valueContainer: (base) => ({ ...base, height: '36px', padding: '0 8px' }),
                indicatorsContainer: (base) => ({ ...base, height: '36px' }),
              }}
            />
          </div>
          <div className="w-full">
            <label className="block text-xs mb-1">Date</label>
            <input type="date" value={insertDate} onChange={(e) => setInsertDate(e.target.value)} className="h-9 w-full px-2 text-xs border border-gray-300 rounded-md" />
          </div>
          <div className="w-full">
            <label className="block text-xs mb-1">Nb lignes</label>
            <input
              type="number"
              min={1}
              value={insertCount}
              onChange={(e) => setInsertCount(Number(e.target.value))}
              className="h-9 w-full px-2 text-xs text-center border border-gray-300 rounded-md"
            />
          </div>
          <div className="w-full">
            <label className="block text-xs mb-1 invisible">Action</label>
            <button disabled={!permissions.canCreate} onClick={handleInsert} className="h-9 w-full bg-green-500 text-white rounded flex items-center justify-center gap-1 text-xs hover:bg-green-600">
              <Plus className="w-3 h-3" /> Insérer
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsSection />

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border border-gray-200 overflow-x-auto">
          <button
            onClick={() => setFilter('tab', 'tous')}
            className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base whitespace-nowrap ${activeTab === 'tous' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-600'}`}
          >
            Tous les Tickets
          </button>
          <button
            onClick={() => setFilter('tab', 'livreur')}
            className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base whitespace-nowrap ${activeTab === 'livreur' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-600'}`}
          >
            Par Livreur
          </button>
        </div>

        {activeTab === 'tous' && (
          <div className="p-4">
            {/* Filters */}
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

            {/* Table */}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
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
                {/* Infinite scroll sentinel */}
                <div className="h-0.5" ref={observerTarget}>
                  {infiniteState.isFetchingNextPage && <p className="text-xs text-gray-500 w-full text-center py-2">Chargement des données...</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'livreur' && <TicketTabLivreur />}
      </div>

      {/* Actions footer */}
      {activeTab !== 'livreur' && (
        <TicketTableActions
          ticketsData={ticketsData}
          selectedRows={selectedRowIds}
          permissions={permissions}
          isDeletingBonLivraison={isDeletingBonLivraison}
          onDeleteRows={handleDeleteRows}
        />
      )}

      <ConfirmModal
        isOpen={ticketToDelete !== null}
        onClose={() => setTicketToDelete(null)}
        title="Supprimer le ticket"
        isLoading={isDeletingBonLivraison}
        actions={[
          { label: 'Annuler', variant: 'light', onPress: () => setTicketToDelete(null) },
          { label: 'Supprimer', color: 'danger', onPress: handleConfirmDelete },
        ]}
      >
        Confirmez-vous la suppression définitive de ce ticket ? Cette action est irréversible.
      </ConfirmModal>
    </div>
  );
}
