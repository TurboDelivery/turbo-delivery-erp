'use client';

import type { ReactNode } from 'react';
import { flexRender, Table as ReactTable, Row } from '@tanstack/react-table';
import { Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';

interface PaiementTableProps<T> {
  table: ReactTable<T>;
  isLoading?: boolean;
  isFetching?: boolean;
  pageCount?: number;
  emptyMessage?: string;
  /**
   * Carte mobile par ligne (affichée < md, le tableau prend le relais ≥ md).
   * Reçoit la `Row` tanstack complète (pour réutiliser la sélection :
   * `row.getIsSelected()` / `row.toggleSelected()`). Quand non fourni, le
   * tableau reste affiché à toutes les tailles (comportement historique
   * inchangé — ne casse pas les autres consommateurs de ce wrapper).
   */
  renderMobileCard?: (row: Row<T>) => ReactNode;
}

export default function PaiementTable<T>({ table, isLoading, isFetching, pageCount = 0, emptyMessage = 'Aucun paiement', renderMobileCard }: PaiementTableProps<T>) {
  const colsCount = table.getFlatHeaders().length;
  const rows = table.getRowModel().rows;

  const paginationBar = pageCount > 1 && (
    <div className="flex justify-center py-4 border-t">
      <Pagination
        total={pageCount}
        page={table.getState().pagination.pageIndex + 1}
        onChange={(page) => table.setPageIndex(page - 1)}
        color="primary"
        isDisabled={isFetching}
      />
    </div>
  );

  const tableBlock = (
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
          rows.map((row) => (
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
  );

  // Pas de carte mobile demandée → comportement historique (tableau à toutes tailles).
  if (!renderMobileCard) {
    return (
      <div>
        {tableBlock}
        {paginationBar}
      </div>
    );
  }

  return (
    <div>
      {/* Tableau — desktop uniquement (≥ md) */}
      <div className="hidden md:block">
        {tableBlock}
        {paginationBar}
      </div>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className={`md:hidden space-y-3 p-4 ${isFetching ? 'opacity-60' : ''}`}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`m-skel-${i}`} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
          ))
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">{emptyMessage}</p>
        ) : (
          rows.map((row) => renderMobileCard(row))
        )}
        {pageCount > 1 && (
          <div className="flex justify-center pt-2">
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
    </div>
  );
}
