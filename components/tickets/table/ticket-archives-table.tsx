'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Input, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import Select from 'react-select';
import { toast } from 'sonner';
import { ArchiveRestore, Loader2, Search, X } from 'lucide-react';

import ConfirmModal from '@/components/ui/confirm-modal';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCFA, formatDateFR, formatHoursMinutes } from '@/src/actions/bonLivraison.mapper';
import { useAbility } from '@/hooks/use-ability';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { useTicketArchivesInfiniteQuery } from '@/features/tickets/queries/ticket-archives.query';
import { useRestaurerArchives } from '@/features/tickets/queries/tickets.mutation';
import { IArchiveBonLivraisonVm } from '@/features/tickets/types/tickets.type';
import { ticketArchivesColumns, TicketArchivesColumnMeta } from './ticket-archives-columns';

interface TicketArchivesTableProps {
  restaurantOptions: { value: string; label: string }[];
  livreurOptions: { value: string; label: string }[];
}

export function TicketArchivesTable({ restaurantOptions, livreurOptions }: TicketArchivesTableProps) {
  const ability = useAbility();
  const canRestore = ability.can('update', 'Ticket');

  const [numero, setNumero] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [livreurId, setLivreurId] = useState('');
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);

  const archivesQuery = useTicketArchivesInfiniteQuery({
    numero: numero || undefined,
    restaurantId: restaurantId || undefined,
    livreurId: livreurId || undefined,
  });

  const archives = useMemo<IArchiveBonLivraisonVm[]>(
    () => archivesQuery.data?.pages.flatMap((p) => p.content) ?? [],
    [archivesQuery.data],
  );
  const totalItems = archivesQuery.data?.pages[0]?.totalElements ?? 0;

  const observerTarget = useInfiniteScroll(archivesQuery.fetchNextPage, archivesQuery.hasNextPage ?? false);
  // Sentinelle dédiée aux cartes mobile (le sentinel desktop est masqué < md et n'intersecte jamais)
  const observerTargetMobile = useInfiniteScroll(archivesQuery.fetchNextPage, archivesQuery.hasNextPage ?? false);

  const restaurerMutation = useRestaurerArchives(() => {
    setRowSelection({});
    setRestoringId(null);
    setConfirmIds(null);
  });

  const handleRestoreRow = useCallback((commandeId: string) => {
    setConfirmIds([commandeId]);
  }, []);

  const tableMeta: TicketArchivesColumnMeta = useMemo(
    () => ({ onRestoreRow: handleRestoreRow, isRestoringId: restoringId, canRestore }),
    [handleRestoreRow, restoringId, canRestore],
  );

  const table = useReactTable({
    data: archives,
    columns: ticketArchivesColumns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
    meta: tableMeta,
    getRowId: (row) => row.commandeId,
  });

  const selectedIds = useMemo(
    () => table.getFilteredSelectedRowModel().rows.map((r) => r.original.commandeId),
    [table, rowSelection],
  );

  const handleBulkRestore = useCallback(() => {
    if (selectedIds.length === 0) {
      toast.warning('Aucune ligne sélectionnée');
      return;
    }
    setConfirmIds(selectedIds);
  }, [selectedIds]);

  const handleConfirmRestore = useCallback(() => {
    if (!confirmIds || confirmIds.length === 0) return;
    if (confirmIds.length === 1) setRestoringId(confirmIds[0]);
    restaurerMutation.mutate(confirmIds);
  }, [confirmIds, restaurerMutation]);

  const colsCount = table.getAllColumns().length;

  return (
    <div className="p-4">
      <div className="mb-6">
        <Input
          className="mb-4"
          startContent={<Search />}
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="Code check"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium mb-1">Filtrer par Livreur</label>
            <Select
              options={livreurOptions}
              value={livreurOptions.find((o) => o.value === livreurId) ?? null}
              onChange={(opt) => setLivreurId(opt?.value ?? '')}
              placeholder="Tous les livreurs"
              isClearable
              className="text-xs"
              classNamePrefix="react-select"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Filtrer par Restaurant</label>
            <Select
              options={restaurantOptions}
              value={restaurantOptions.find((o) => o.value === restaurantId) ?? null}
              onChange={(opt) => setRestaurantId(opt?.value ?? '')}
              placeholder="Tous les restaurants"
              isClearable
              className="text-xs"
              classNamePrefix="react-select"
            />
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs sm:text-sm text-gray-600">Total: {totalItems} ticket(s) archivé(s)</p>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setRowSelection({})}
              className="px-2 py-1 border border-gray-300 rounded-full text-xs hover:bg-gray-50 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Désélectionner
            </button>
          )}
          <button
            onClick={handleBulkRestore}
            disabled={!canRestore || selectedIds.length === 0 || restaurerMutation.isPending}
            className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 ${
              !canRestore || selectedIds.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            {restaurerMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArchiveRestore className="w-3 h-3" />}
            Restaurer ({selectedIds.length})
          </button>
        </div>
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
            <TableBody emptyContent={archivesQuery.isLoading ? 'Chargement des archives...' : 'Aucun ticket archivé.'}>
              {archivesQuery.isLoading
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
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={row.getIsSelected() ? 'bg-blue-50' : 'hover:bg-gray-50'}>
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
            {archivesQuery.isFetchingNextPage && <p className="text-xs text-gray-500 w-full text-center py-2">Chargement des données...</p>}
          </div>
        </div>
      </div>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="md:hidden space-y-3">
        {archivesQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />)
        ) : table.getRowModel().rows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Aucun ticket archivé.</p>
        ) : (
          table.getRowModel().rows.map((row) => {
            const a = row.original;
            const deletedBy = a.deletedByUser ? `${a.deletedByUser.prenoms} ${a.deletedByUser.nom}` : '—';
            return (
              <div key={row.id} className={`bg-white border rounded-xl p-4 shadow-sm space-y-2 ${row.getIsSelected() ? 'border-blue-300 bg-blue-50' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Code Check</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{a.reference}</p>
                    <p className="text-xs text-blue-500 truncate">{a.restaurant}</p>
                  </div>
                  <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Sélectionner la ligne" />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400 shrink-0">Livreur</span>
                  <span className="text-sm text-gray-700 text-right truncate">{a.livreur}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400 shrink-0">Zone</span>
                  <span className="text-sm text-gray-700 text-right truncate">{a.nomZone ?? 'Inconnue'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400 shrink-0">Montant de Livraison</span>
                  <span className="text-sm text-gray-700 text-right">{formatCFA(a.coutLivraison)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400 shrink-0">Montant de Commande</span>
                  <span className="text-sm text-gray-700 text-right">{formatCFA(a.coutCommande)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400 shrink-0">Commission</span>
                  <span className="text-sm text-gray-700 text-right">{formatCFA(a.commission ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400 shrink-0">Date</span>
                  <span className="text-sm text-gray-700 text-right">{formatDateFR(a.date)} · {formatHoursMinutes(a.heure)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400 shrink-0">Supprimé par</span>
                  <span className="text-sm text-gray-700 text-right truncate">{deletedBy}</span>
                </div>
                {a.motifAnnulation && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400 shrink-0">Motif</span>
                    <span className="text-sm text-gray-700 text-right truncate">{a.motifAnnulation}</span>
                  </div>
                )}

                {canRestore && (
                  <div className="pt-1">
                    <button
                      onClick={() => handleRestoreRow(a.commandeId)}
                      disabled={restoringId === a.commandeId}
                      className="w-full px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {restoringId === a.commandeId ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArchiveRestore className="w-4 h-4" />}
                      Restaurer
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div className="h-0.5" ref={observerTargetMobile}>
          {archivesQuery.isFetchingNextPage && <p className="text-xs text-gray-500 w-full text-center py-2">Chargement des données...</p>}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmIds !== null}
        onClose={() => setConfirmIds(null)}
        title={confirmIds?.length === 1 ? 'Restaurer le ticket' : `Restaurer ${confirmIds?.length ?? 0} ticket(s)`}
        isLoading={restaurerMutation.isPending}
        actions={[
          { label: 'Annuler', variant: 'light', onPress: () => setConfirmIds(null) },
          { label: 'Restaurer', color: 'success', onPress: handleConfirmRestore },
        ]}
      >
        {confirmIds?.length === 1
          ? 'Confirmez-vous la restauration de ce ticket ?'
          : `Confirmez-vous la restauration de ${confirmIds?.length ?? 0} ticket(s) ?`}
      </ConfirmModal>
    </div>
  );
}
