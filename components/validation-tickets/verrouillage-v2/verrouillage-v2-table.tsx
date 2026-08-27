'use client';

import { useEffect, useMemo, useRef } from 'react';
import { getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/heroui';
import EtatErreur from '@/components/commons/EtatErreur';
import { Loader2 } from 'lucide-react';
import { TicketControleV2 } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { buildVerrouillageV2Columns, VerrouillageV2RowActions } from './verrouillage-v2-columns';
import TicketV2MobileCard from './ticket-v2-mobile-card';

interface VerrouillageV2TableProps {
  tickets: TicketControleV2[];
  totalElements: number;
  isLoading: boolean;
  isError?: boolean;
  onReessayer?: () => void;
  validatingId: string | null;
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** Lecture seule : masque la colonne d'actions (Valider V2 / Rejeter). */
  readOnly?: boolean;
}

export function VerrouillageV2Table({
  tickets,
  totalElements,
  isLoading,
  isError = false,
  onReessayer,
  validatingId,
  onValidate,
  onReject,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  readOnly = false,
}: VerrouillageV2TableProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const bottomRefMobile = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 },
    );
    // Observe les deux sentinelles (tableau desktop + liste mobile) : celle qui
    // est masquée par `display:none` ne déclenche jamais d'intersection.
    if (bottomRef.current) observer.observe(bottomRef.current);
    if (bottomRefMobile.current) observer.observe(bottomRefMobile.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  const columns = useMemo(
    () => buildVerrouillageV2Columns(onValidate, onReject, validatingId, readOnly),
    [onValidate, onReject, validatingId, readOnly],
  );

  const table = useReactTable({
    data: tickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div>
          <p className="font-semibold text-gray-900">Récapitulatif final</p>
          <p className="text-xs text-gray-400">À vérifier avant verrouillage définitif</p>
        </div>
        <p className="text-xs text-gray-500">{totalElements} ligne{totalElements > 1 ? 's' : ''}</p>
      </div>
      {/* Tableau — desktop uniquement (≥ md) */}
      <div className="hidden md:block overflow-x-auto">
        <Table
          isStriped
          isHeaderSticky
          aria-label="Récapitulatif final des tickets V2"
          classNames={{
            base: 'rounded-none',
            wrapper: 'max-h-[60vh] rounded-none shadow-none p-0',
          }}
          bottomContent={
            <div ref={bottomRef} className="flex items-center justify-center py-3">
              {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            </div>
          }
        >
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableColumn key={header.id}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent={
              /* Un echec de chargement ne doit pas se lire comme une liste vide. */
              isError ? <EtatErreur quoi="les tickets à verrouiller" onReessayer={onReessayer} /> : isLoading ? ' ' : 'Aucun ticket trouvé'
            }>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {table.getFlatHeaders().map((header) => (
                      <TableCell key={header.id}>
                        <div className="h-4 rounded bg-gray-100 animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
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
      <div className="md:hidden space-y-3 p-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={`m-skel-${i}`} className="h-52 rounded-xl bg-gray-100 animate-pulse" />
          ))
        ) : tickets.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">Aucun ticket trouvé</p>
        ) : (
          tickets.map((ticket) => (
            <TicketV2MobileCard
              key={ticket.commandeId}
              ticket={ticket}
              actions={
                readOnly ? undefined : (
                  <VerrouillageV2RowActions
                    ticket={ticket}
                    isValidating={validatingId === ticket.commandeId}
                    onValidate={onValidate}
                    onReject={onReject}
                    fullWidth
                  />
                )
              }
            />
          ))
        )}
        <div ref={bottomRefMobile} className="flex items-center justify-center py-1">
          {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </div>
      </div>
    </div>
  );
}
