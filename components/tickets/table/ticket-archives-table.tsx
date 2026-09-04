'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  Button,
  ComboBox,
  Tooltip,
  Input as InputV3,
  Label,
  ListBox,
  SearchField,
} from '@heroui-v3/react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/heroui';
import { toast } from 'sonner';
import { ArchiveRestore, X } from 'lucide-react';

import ConfirmModal from '@/components/ui/confirm-modal';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCFA, formatDateFR, formatHoursMinutes } from '@/src/actions/bonLivraison.mapper';
import { useAbility } from '@/hooks/use-ability';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { useTicketArchivesInfiniteQuery } from '@/features/tickets/queries/ticket-archives.query';
import { useRestaurerArchives } from '@/features/tickets/queries/tickets.mutation';
import { IArchiveBonLivraisonVm } from '@/features/tickets/types/tickets.type';
import { ticketArchivesColumns, TicketArchivesColumnMeta } from './ticket-archives-columns';
import EtatErreur from '@/components/commons/EtatErreur';

interface TicketArchivesTableProps {
  restaurantOptions: { value: string; label: string }[];
  livreurOptions: { value: string; label: string }[];
}

/** Aucun filtre pose : la liste montre tout. */
const TOUS = '__tous__';

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

  // Sans motif affiche, un bouton grise par le role passe pour un bug cote operateur.
  // On nomme la cause bloquante, le droit d'abord ; la restauration en cours a son spinner.
  const motifRestaurationBloquee = !canRestore
    ? 'Votre rôle ne permet pas de restaurer un ticket archivé'
    : selectedIds.length === 0
      ? 'Sélectionnez au moins un ticket à restaurer'
      : '';

  return (
    <div className="p-4">
      <div className="mb-6">
        {/* Memes composants que l'onglet « Tous les tickets » : deux listes FILTRABLES et
            un champ de recherche effacable. react-select apportait ses propres couleurs,
            qui ignorent le theme sombre, et une bibliotheque de plus a charger. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SearchField fullWidth onChange={setNumero} value={numero}>
            <Label>Code check</Label>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Rechercher un code…" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <ComboBox
            onSelectionChange={(c) => setLivreurId(c === TOUS ? '' : String(c ?? ''))}
            selectedKey={livreurId || TOUS}
          >
            <Label>Livreur</Label>
            <ComboBox.InputGroup>
              <InputV3 placeholder="Tous les livreurs" />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox items={[{ value: TOUS, label: 'Tous les livreurs' }, ...livreurOptions]}>
                {(o: { value: string; label: string }) => (
                  <ListBox.Item id={o.value} textValue={o.label}>
                    {o.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>

          <ComboBox
            onSelectionChange={(c) => setRestaurantId(c === TOUS ? '' : String(c ?? ''))}
            selectedKey={restaurantId || TOUS}
          >
            <Label>Partenaire</Label>
            <ComboBox.InputGroup>
              <InputV3 placeholder="Tous les partenaires" />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox items={[{ value: TOUS, label: 'Tous les partenaires' }, ...restaurantOptions]}>
                {(o: { value: string; label: string }) => (
                  <ListBox.Item id={o.value} textValue={o.label}>
                    {o.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {/* `totalElements` est indisponible sur echec et `?? 0` rendait « Total: 0 ticket(s)
            archive(s) », une affirmation de fait la ou la lecture avait simplement echoue. */}
        {!archivesQuery.isError && (
          <p className="text-xs text-muted sm:text-sm">Total : {totalItems} ticket(s) archivé(s)</p>
        )}
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button onPress={() => setRowSelection({})} size="sm" variant="ghost">
              <X aria-hidden="true" className="size-4" />
              Désélectionner
            </Button>
          )}
          {/* Un bouton desactive n'emet aucun survol : le span porte l'evenement a la place. */}
          {/* Le motif de blocage est nomme : un bouton grise sans explication passe pour
              une panne cote operateur. L'attente se dit par `isPending`, ce qui evite un
              rond qui tourne pose a la main. */}
          <Tooltip>
            <Button
              isDisabled={!canRestore || selectedIds.length === 0}
              isPending={restaurerMutation.isPending}
              onPress={handleBulkRestore}
              size="sm"
              variant="primary"
            >
              <ArchiveRestore aria-hidden="true" className="size-4" />
              Restaurer ({selectedIds.length})
            </Button>
            <Tooltip.Content>
              {motifRestaurationBloquee || `Restaurer ${selectedIds.length} ticket(s) archivé(s)`}
            </Tooltip.Content>
          </Tooltip>
        </div>
      </div>

      {/* Echec de LECTURE, distinct d'archives vides. Sans cette branche, le tableau
          affichait « Aucun ticket archive » et les cartes mobiles la meme phrase : cela se
          lit comme un resultat, pas comme une panne, et les trois colonnes monetaires
          (cout de livraison, cout de commande, commission) disparaissaient en silence. */}
      {archivesQuery.isError ? (
        <EtatErreur
          quoi="les tickets archivés"
          onReessayer={() => archivesQuery.refetch()}
          enCours={archivesQuery.isFetching}
        />
      ) : (
        <>
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
            <TableBody emptyContent={archivesQuery.isLoading ? 'Chargement des archives...' : 'Aucun ticket archivé'}>
              {archivesQuery.isLoading
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
            {archivesQuery.isFetchingNextPage && <p className="w-full py-2 text-center text-xs text-muted">Chargement des données...</p>}
          </div>
        </div>
      </div>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="md:hidden space-y-3">
        {archivesQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-surface-secondary" />)
        ) : table.getRowModel().rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Aucun ticket archivé</p>
        ) : (
          table.getRowModel().rows.map((row) => {
            const a = row.original;
            const deletedBy = a.deletedByUser ? `${a.deletedByUser.prenoms} ${a.deletedByUser.nom}` : '—';
            return (
              <div key={row.id} className={`space-y-2 rounded-xl border bg-surface p-4 shadow-xs ${row.getIsSelected() ? 'border-accent bg-accent-soft/40' : 'border-separator'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted">Code Check</p>
                    <p className="truncate text-sm font-semibold text-foreground">{a.reference}</p>
                    <p className="text-xs text-blue-500 truncate">{a.restaurant}</p>
                  </div>
                  <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Sélectionner la ligne" />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Livreur</span>
                  <span className="truncate text-right text-sm text-foreground">{a.livreur}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Zone</span>
                  <span className="truncate text-right text-sm text-foreground">{a.nomZone ?? 'Inconnue'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Montant de Livraison</span>
                  <span className="text-right text-sm text-foreground">{formatCFA(a.coutLivraison)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Montant de Commande</span>
                  <span className="text-right text-sm text-foreground">{formatCFA(a.coutCommande)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Commission</span>
                  <span className="text-right text-sm text-foreground">{formatCFA(a.commission ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Date</span>
                  <span className="text-right text-sm text-foreground">{formatDateFR(a.date)} · {formatHoursMinutes(a.heure)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Supprimé par</span>
                  <span className="truncate text-right text-sm text-foreground">{deletedBy}</span>
                </div>
                {a.motifAnnulation && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="shrink-0 text-xs text-muted">Motif</span>
                    <span className="truncate text-right text-sm text-foreground">{a.motifAnnulation}</span>
                  </div>
                )}

                {canRestore && (
                  <div className="pt-1">
                    <Button
                      className="w-full"
                      isPending={restoringId === a.commandeId}
                      onPress={() => handleRestoreRow(a.commandeId)}
                      variant="primary"
                    >
                      <ArchiveRestore aria-hidden="true" className="size-4" />
                      Restaurer
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div className="h-0.5" ref={observerTargetMobile}>
          {archivesQuery.isFetchingNextPage && <p className="w-full py-2 text-center text-xs text-muted">Chargement des données...</p>}
        </div>
      </div>
        </>
      )}

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
