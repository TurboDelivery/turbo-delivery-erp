'use client';

import type { ReactNode } from 'react';
import { flexRender, Table } from '@tanstack/react-table';
import { Pagination, Table as HTable, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';

interface ChargesTableV2Props<T> {
  table: Table<T>;
  isLoading?: boolean;
  isFetching?: boolean;
  pageCount?: number;
  emptyMessage?: string;
  getRowClassName?: (row: T) => string;
  /**
   * Carte mobile par ligne (affichée < md, le tableau prend le relais ≥ md).
   * Reçoit `row.original` — même donnée que la ligne du tableau. Quand non
   * fourni, le tableau reste affiché à toutes les tailles (comportement
   * historique inchangé).
   */
  renderMobileCard?: (row: T) => ReactNode;
}

export default function ChargesTableV2<T>({
  table,
  isLoading,
  isFetching,
  pageCount,
  emptyMessage = 'Aucune donnée',
  getRowClassName,
  renderMobileCard,
}: ChargesTableV2Props<T>) {
  const colsCount = table.getAllColumns().length;
  const effectivePageCount = pageCount ?? table.getPageCount();
  const rows = table.getRowModel().rows;

  const tableContent = (
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
            : rows.map((row) => {
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

  // Pas de carte mobile demandée → comportement historique (tableau à toutes tailles).
  if (!renderMobileCard) return tableContent;

  return (
    <>
      {/* Tableau — desktop uniquement (≥ md) */}
      <div className="hidden md:block">{tableContent}</div>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className={`md:hidden space-y-3 p-4 ${isFetching ? 'opacity-60' : ''}`}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`m-skel-${i}`} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
          ))
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">{emptyMessage}</p>
        ) : (
          rows.map((row) => renderMobileCard(row.original))
        )}
        {effectivePageCount > 1 && (
          <div className="flex justify-center pt-2">
            <Pagination
              total={effectivePageCount}
              page={table.getState().pagination.pageIndex + 1}
              onChange={(page) => table.setPageIndex(page - 1)}
              color="primary"
              isDisabled={isFetching}
            />
          </div>
        )}
      </div>
    </>
  );
}
