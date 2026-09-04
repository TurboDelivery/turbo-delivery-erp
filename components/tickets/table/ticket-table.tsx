'use client';

import React, { useMemo, useState, useCallback, useRef } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/heroui';
import { Tabs } from '@heroui-v3/react';
import EtatErreur from '@/components/commons/EtatErreur';
import { useHauteurDisponible } from '@/hooks/use-hauteur-disponible';
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
    resetFilters,
    ticketsData,
    isLoading,
    isError,
    infiniteState,
    mutations: { deleteBonLivraisonMutation, isDeletingBonLivraison, isUpdatingBonLivraison },
    editing,
  } = useTickets(restaurants);

  // La hauteur du tableau est MESUREE depuis sa position reelle dans la fenetre.
  // Regle du projet : ni plafond en pixels, ni calc(100vh-Xrem), qui se decalent des
  // qu'un filtre ou un titre change de hauteur.
  const zoneTableRef = useRef<HTMLDivElement>(null);
  const hauteurTable = useHauteurDisponible(zoneTableRef);

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
    <div className="p-2">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 lg:mb-8">
        {/* `bg-red-500` et `text-gray-500` etaient ecrits en dur : depuis que la bascule
            de theme est dans l'en-tete, ce bloc s'affichait en clair sur une interface
            sombre. Jetons semantiques, comme partout ailleurs. */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent">
            <Package aria-hidden="true" className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mes tickets</h1>
            <p className="text-xs text-muted sm:text-sm">Système de suivi des tickets de livraison</p>
          </div>
        </div>
      </div>

      <StatsSection />

      <div className="rounded-large border border-separator bg-surface">
        {/* UNE seule bordure : la barre portait la sienne A L'INTERIEUR de celle de la
            carte, soit deux traits gris a un pixel d'ecart. Le compte des tickets remonte
            ici, ce qui rend une ligne entiere au tableau : sur la fenetre reelle des
            postes (563 px de haut), une ligne, c'est un ticket de plus a l'ecran.
            Couleurs par JETONS (`primary`, `default-500`) et non plus `red-500` et
            `gray-600` ecrits en dur, sans quoi le mode sombre restera impossible. */}
        {/*
          Deux `<button>` bruts tenaient lieu d'onglets : aucun role ARIA, donc un lecteur
          d'ecran annoncait deux boutons sans dire lequel etait actif ni combien il y en
          avait, et les fleches du clavier ne circulaient pas entre eux. `Tabs` porte le
          role, l'etat selectionne et la navigation au clavier sans qu'on ait a les ecrire.
        */}
        <div className="flex items-end justify-between gap-4 border-b border-separator px-4 pt-3">
          <Tabs onSelectionChange={(cle) => setFilter('tab', String(cle))} selectedKey={activeTab}>
            <Tabs.List>
              <Tabs.Tab id="tous">Tous les tickets</Tabs.Tab>
              <Tabs.Tab id="archives">Archives</Tabs.Tab>
              <Tabs.Indicator />
            </Tabs.List>
          </Tabs>
          <span className="whitespace-nowrap pb-3 text-[11px] font-semibold uppercase tracking-wide tabular-nums text-muted">
            {infiniteState.totalItems} ticket{infiniteState.totalItems > 1 ? 's' : ''}
          </span>
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
              onReset={resetFilters}
            />
            {/* Le compte est remonte dans la barre d'onglets et l'export rejoint la barre
                de filtres : deux lignes rendues au tableau, et le geste se trouve la ou on
                le cherche plutot que sur une ligne isolee. */}
            <div className="mb-3 flex justify-end">
              <TicketTableExportButton filters={filters} totalItems={infiniteState.totalItems} isDisabled={isLoading} />
            </div>
            <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
              {/* Hauteur MESUREE, jamais un plafond en dur. Le `max-h-[420px]` precedent
                  laissait environ 340 px de tableau sur la fenetre reelle des postes
                  (1000x563), et perdait une rangee des qu'un titre passait sur deux lignes. */}
              {/* Repli AVANT mesure, et surtout : sur les postes reels.
                  `useHauteurDisponible` se desactive sous 1024 px de large (son point de
                  rupture `lg`) et rend alors `undefined` — or la fenetre des postes fait
                  1000x563, soit JUSTE en dessous. Sur ces machines le style en ligne
                  n'arrivait donc jamais, ce conteneur n'avait aucune hauteur, et
                  `overflow-y-auto` n'avait rien a borner : le tableau s'allongeait sans
                  fin et c'est la PAGE qui defilait, l'en-tete de colonnes disparaissant
                  vers le haut. Le repli borne la zone des `md` (la ou ce tableau
                  apparait), et la mesure le remplace des qu'elle arrive. */}
              <div
                ref={zoneTableRef}
                className="overflow-y-auto md:h-[calc(100vh-15rem)] md:min-h-[320px]"
                style={hauteurTable ? { height: hauteurTable } : undefined}
              >
                <Table isStriped>
                  <TableHeader>
                    {table.getFlatHeaders().map((header) => (
                      <TableColumn key={header.id} className="text-xs sm:text-sm font-medium whitespace-nowrap">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableColumn>
                    ))}
                  </TableHeader>
                  <TableBody
                    emptyContent={
                      /* Un echec de chargement ne doit PAS se lire comme un resultat vide :
                         l'operateur en concluait qu'il n'y avait aucun ticket a traiter. */
                      isError ? (
                        <EtatErreur quoi="les tickets" onReessayer={() => infiniteState.refetch()} />
                      ) : isLoading ? (
                        'Chargement des tickets...'
                      ) : (
                        'Aucun ticket trouvé'
                      )
                    }
                  >
                    {isLoading
                      ? Array.from({ length: 10 }).map((_, i) => (
                          <TableRow key={`skeleton-${i}`}>
                            {Array.from({ length: colsCount }).map((_, j) => (
                              <TableCell key={`skeleton-cell-${j}`} className="h-12">
                                <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      : table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={row.getIsSelected() ? 'bg-accent-soft' : 'hover:bg-surface-secondary'}>
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
                  {infiniteState.isFetchingNextPage && <p className="w-full py-2 text-center text-xs text-muted">Chargement des données...</p>}
                </div>
              </div>
            </div>

            {/* Mobile — cartes tactiles (remplace le tableau < md) */}
            <div className="md:hidden space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-xl bg-surface-secondary" />)
              ) : table.getRowModel().rows.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">Aucun ticket trouvé</p>
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
                {infiniteState.isFetchingNextPage && <p className="w-full py-2 text-center text-xs text-muted">Chargement des données...</p>}
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
