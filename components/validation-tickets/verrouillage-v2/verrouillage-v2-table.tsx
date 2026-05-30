'use client';

import { useEffect, useMemo, useRef } from 'react';
import { getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { Loader2 } from 'lucide-react';
import { TicketControleV2 } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { buildVerrouillageV2Columns } from './verrouillage-v2-columns';

interface VerrouillageV2TableProps {
  tickets: TicketControleV2[];
  totalElements: number;
  isLoading: boolean;
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
  validatingId,
  onValidate,
  onReject,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  readOnly = false,
}: VerrouillageV2TableProps) {
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
      <div className="overflow-x-auto">
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
          <TableBody emptyContent={isLoading ? ' ' : 'Aucun ticket trouvé'}>
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
    </div>
  );
}
