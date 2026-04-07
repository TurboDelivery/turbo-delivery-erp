'use client';

import { flexRender, Table } from '@tanstack/react-table';
import { Pagination, Table as HTable, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';

interface ChargesTableV2Props<T> {
  table: Table<T>;
  isLoading?: boolean;
  isFetching?: boolean;
  pageCount?: number;
  emptyMessage?: string;
  getRowClassName?: (row: T) => string;
}

export default function ChargesTableV2<T>({
  table,
  isLoading,
  isFetching,
  pageCount,
  emptyMessage = 'Aucune donnée',
  getRowClassName,
}: ChargesTableV2Props<T>) {
  const colsCount = table.getAllColumns().length;
  const effectivePageCount = pageCount ?? table.getPageCount();

  return (
    <div className="overflow-x-auto">
      <HTable
        isStriped
        bottomContent={
          effectivePageCount > 1 && (
            <div className="flex justify-center py-3">
              <Pagination
                total={effectivePageCount}
                page={table.getState().pagination.pageIndex + 1}
                onChange={(page) => table.setPageIndex(page - 1)}
                color="primary"
                isDisabled={isFetching}
              />
            </div>
          )
        }
      >
        <TableHeader>
          {table.getFlatHeaders().map((header) => (
            <TableColumn key={header.id}>
              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody emptyContent={emptyMessage}>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: colsCount }).map((_, j) => (
                    <TableCell key={`skeleton-cell-${j}`} className="h-10">
                      <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : table.getRowModel().rows.map((row) => {
                const rowClass = getRowClassName?.(row.original) ?? '';
                return (
                  <TableRow
                    key={row.id}
                    className={`${isFetching ? 'opacity-60' : ''} ${rowClass}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
        </TableBody>
      </HTable>
    </div>
  );
}
