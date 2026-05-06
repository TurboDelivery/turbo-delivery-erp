'use client';

import { flexRender, Table as ReactTable } from '@tanstack/react-table';
import { Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';

interface PaiementTableProps<T> {
  table: ReactTable<T>;
  isLoading?: boolean;
  isFetching?: boolean;
  pageCount?: number;
  emptyMessage?: string;
}

export default function PaiementTable<T>({ table, isLoading, isFetching, pageCount = 0, emptyMessage = 'Aucune donnée' }: PaiementTableProps<T>) {
  const colsCount = table.getFlatHeaders().length;

  return (
    <div>
      <Table isStriped aria-label="Tableau des charges à décaisser">
        <TableHeader>
          {table.getFlatHeaders().map((header) => (
            <TableColumn key={header.id}>
              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody emptyContent={emptyMessage}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {Array.from({ length: colsCount }).map((_, j) => (
                  <TableCell key={`skeleton-cell-${j}`}>
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className={isFetching ? 'opacity-60' : ''}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pageCount > 1 && (
        <div className="flex justify-center py-4 border-t">
          <Pagination
            total={pageCount}
            page={table.getState().pagination.pageIndex + 1}
            onChange={(page) => table.setPageIndex(page - 1)}
            color="primary"
            isDisabled={isFetching}
          />
        </div>
      )}
    </div>
  );
}
