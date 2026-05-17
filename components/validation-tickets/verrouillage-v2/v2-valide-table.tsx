'use client';

import { useEffect, useRef } from 'react';
import { getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { Loader2, CheckCircle } from 'lucide-react';
import { TicketControleV2 } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { v2ValideColumns } from './v2-valide-columns';

interface V2ValideTableProps {
  tickets: TicketControleV2[];
  totalElements: number;
  isLoading: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export function V2ValideTable({
  tickets,
  totalElements,
  isLoading,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: V2ValideTableProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bottomRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 },
    );
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  const table = useReactTable({
    data: tickets,
    columns: v2ValideColumns,
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
      <div className="overflow-x-auto">
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
    </div>
  );
}
