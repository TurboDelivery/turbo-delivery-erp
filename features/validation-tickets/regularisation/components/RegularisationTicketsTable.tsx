'use client';

import { flexRender } from '@tanstack/react-table';
import {
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { ListFilter, Ticket as TicketIcon, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CreneauSelectPicker from '@/features/validation-tickets/components/CreneauSelectPicker';
import { StatutControle } from '@/types/statut-controle.enum';
import { formatMontant } from '@/utils/format.utils';
import type { RegularisationTicketsColumnMeta } from './regularisation-tickets-columns';
import useRegularisationTicketsTable from '../hooks/use-regularisation-tickets-table';
import {
  STATUT_FILTER_OPTIONS,
  getRegularisationStatutConfig,
  renderRegularisationActions,
} from './regularisation-tickets-columns';
import RegularisationRejetModal from './RegularisationRejetModal';

export default function RegularisationTicketsTable() {
  const {
    table,
    isLoading,
    isFetching,
    columnsCount,
    statut,
    setStatut,
    creneaux,
    creneauId,
    setCreneauId,
    isLoadingCreneaux,
    page,
    setPage,
    totalPages,
    ticketToReject,
    motif,
    setMotif,
    closeReject,
    confirmReject,
    isRejecting,
  } = useRegularisationTicketsTable();

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TicketIcon className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-gray-800">Tickets par statut &amp; créneau</h2>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={statut} onValueChange={(v) => setStatut(v as StatutControle)}>
            <SelectTrigger className="w-full gap-2 text-sm font-medium sm:w-52">
              <ListFilter className="h-4 w-4 shrink-0 text-gray-400" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {STATUT_FILTER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <CreneauSelectPicker
              creneaux={creneaux}
              selectedCreneauId={creneauId}
              onSelectCreneau={setCreneauId}
              disabled={isLoadingCreneaux}
            />
            {creneauId && (
              <button
                type="button"
                onClick={() => setCreneauId(undefined)}
                aria-label="Effacer le créneau"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tableau — desktop uniquement (≥ md) */}
      <div className="hidden md:block overflow-x-auto">
        <Table
          removeWrapper
          aria-label="Tickets par statut et créneau"
          classNames={{
            base: 'text-sm',
            th: 'text-[10px] font-semibold uppercase tracking-wider text-gray-600 bg-gray-100 border-b border-gray-100 px-4 py-3',
            td: 'px-4 py-3 border-b border-gray-50',
          }}
          bottomContent={
            totalPages > 1 ? (
              <div className="flex w-full justify-center py-2">
                <Pagination
                  showControls
                  size="sm"
                  page={page + 1}
                  total={totalPages}
                  onChange={(p) => setPage(p - 1)}
                />
              </div>
            ) : null
          }
        >
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableColumn key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent="Aucun ticket ne correspond à ces filtres">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {Array.from({ length: columnsCount }).map((_, j) => (
                      <TableCell key={`skeleton-${i}-${j}`}>
                        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className={isFetching ? 'opacity-60' : ''}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`m-skel-${i}`} className="h-36 rounded-xl bg-gray-100 animate-pulse" />
          ))
        ) : table.getRowModel().rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">Aucun ticket ne correspond à ces filtres</p>
        ) : (
          table.getRowModel().rows.map((row) => {
            const ticket = row.original;
            const meta = table.options.meta as RegularisationTicketsColumnMeta;
            const cfg = getRegularisationStatutConfig(ticket, meta.authenticatedIds);
            const actions = renderRegularisationActions(ticket, meta, true);
            return (
              <div
                key={row.id}
                className={`bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2 ${isFetching ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{ticket.reference}</p>
                    <p className="truncate text-xs text-gray-500">{ticket.livreur}</p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.className}`}
                  >
                    {cfg.label}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Restaurant</span>
                  <span className="truncate text-right text-sm text-gray-700">{ticket.restaurant}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Montant CMD</span>
                  <span className="text-right text-sm text-gray-700">{formatMontant(ticket.coutCommande)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Coût livraison</span>
                  <span className="text-right text-sm font-medium text-orange-500">
                    {formatMontant(ticket.coutLivraison)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-400">Date / Heure</span>
                  <span className="text-right text-sm text-gray-700">
                    {ticket.date} <span className="text-gray-400">· {ticket.heure}</span>
                  </span>
                </div>

                {actions && <div className="pt-1">{actions}</div>}
              </div>
            );
          })
        )}
        {totalPages > 1 && (
          <div className="flex justify-center pt-1">
            <Pagination
              showControls
              size="sm"
              page={page + 1}
              total={totalPages}
              onChange={(p) => setPage(p - 1)}
            />
          </div>
        )}
      </div>

      <RegularisationRejetModal
        open={ticketToReject !== null}
        reference={ticketToReject?.reference ?? ''}
        motif={motif}
        onMotifChange={setMotif}
        onClose={closeReject}
        onConfirm={confirmReject}
        isLoading={isRejecting}
      />
    </div>
  );
}
