'use client';

import { useEffect, useRef } from 'react';
import { getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { Loader2, CheckCircle } from 'lucide-react';
import { TicketControleV2 } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { buildV2ValideColumns, V2ValideRowActions } from './v2-valide-columns';
import TicketV2MobileCard from './ticket-v2-mobile-card';

interface V2ValideTableProps {
  tickets: TicketControleV2[];
  totalElements: number;
  isLoading: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onReject: (id: string) => void;
  rejectingId?: string | null;
  /** Lecture seule : masque l'action "Rejeter". */
  readOnly?: boolean;
}

export function V2ValideTable({
  tickets,
  totalElements,
  isLoading,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  onReject,
  rejectingId = null,
  readOnly = false,
}: V2ValideTableProps) {
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
    // Observe les deux sentinelles (tableau desktop + liste mobile).
    if (bottomRef.current) observer.observe(bottomRef.current);
    if (bottomRefMobile.current) observer.observe(bottomRefMobile.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  const columns = buildV2ValideColumns(onReject, rejectingId, readOnly);

  const table = useReactTable({
    data: tickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <div>
            <p className="font-semibold text-gray-900">Tickets V2 validés</p>
            <p className="text-xs text-gray-400">Historique des tickets verrouillés V2</p>
          </div>
        </div>
        <p className="text-xs text-gray-500">{totalElements} ligne{totalElements > 1 ? 's' : ''}</p>
      </div>
      {/* Tableau — desktop uniquement (≥ md) */}
      <div className="hidden md:block overflow-x-auto">
        <Table
          isStriped
          isHeaderSticky
          aria-label="Tickets V2 validés"
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
          <TableBody emptyContent={isLoading ? ' ' : 'Aucun ticket V2 validé'}>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
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
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`m-skel-${i}`} className="h-52 rounded-xl bg-gray-100 animate-pulse" />
          ))
        ) : tickets.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">Aucun ticket V2 validé</p>
        ) : (
          tickets.map((ticket) => (
            <TicketV2MobileCard
              key={ticket.commandeId}
              ticket={ticket}
              actions={
                readOnly ? undefined : (
                  <V2ValideRowActions
                    ticket={ticket}
                    isRejecting={rejectingId === ticket.commandeId}
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
