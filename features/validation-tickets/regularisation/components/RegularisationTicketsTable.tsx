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
import useRegularisationTicketsTable from '../hooks/use-regularisation-tickets-table';
import { STATUT_FILTER_OPTIONS } from './regularisation-tickets-columns';
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

      <div className="overflow-x-auto">
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
          <TableBody emptyContent="Aucun ticket pour ce filtre.">
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
