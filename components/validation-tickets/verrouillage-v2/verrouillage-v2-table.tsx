'use client';

import { useMemo, useState } from 'react';
import { getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';
import { Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { TicketControleV2 } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { buildVerrouillageV2Columns } from './verrouillage-v2-columns';

interface VerrouillageV2TableProps {
  tickets: TicketControleV2[];
  validatingId: string | null;
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
}

const PAGE_SIZE = 10;

export function VerrouillageV2Table({ tickets, validatingId, onValidate, onReject }: VerrouillageV2TableProps) {
  const [page, setPage] = useState(1);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(tickets.length / PAGE_SIZE)),
    [tickets.length],
  );

  const safePage = useMemo(() => Math.min(page, pageCount), [page, pageCount]);

  const paginatedTickets = useMemo(
    () => tickets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [tickets, safePage],
  );

  const columns = useMemo(
    () => buildVerrouillageV2Columns(onValidate, onReject, validatingId),
    [onValidate, onReject, validatingId],
  );

  const table = useReactTable({
    data: paginatedTickets,
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
        <p className="text-xs text-gray-500">{tickets.length} ligne{tickets.length > 1 ? 's' : ''}</p>
      </div>
      <div className="overflow-x-auto">
        <Table
          isStriped
          bottomContent={
            pageCount > 1 ? (
              <div className="flex justify-center pt-4">
                <Pagination total={pageCount} page={safePage} onChange={setPage} color="primary" />
              </div>
            ) : undefined
          }
        >
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableColumn key={header.id}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent="Aucun ticket trouvé">
            {table.getRowModel().rows.map((row) => (
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
