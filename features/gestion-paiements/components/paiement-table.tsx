'use client';

import { Table } from '@heroui-v3/react';
import { flexRender, Table as ReactTable, Row } from '@tanstack/react-table';
import type { ReactNode } from 'react';

import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';

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
  const enTetes = table.getFlatHeaders();
  const rows = table.getRowModel().rows;

  const paginationBar = pageCount > 1 && (
    <div className="flex justify-center border-t border-separator py-4">
      <PaginationTableau
        onPage={(page) => table.setPageIndex(page - 1)}
        page={table.getState().pagination.pageIndex + 1}
        total={pageCount}
      />
    </div>
  );

  const tableBlock = (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="Tableau des charges à décaisser" className="min-w-[52rem]">
          <Table.Header>
            {enTetes.map((header) => (
              <Table.Column id={header.id} isRowHeader={header.id === 'designation'} key={header.id}>
                {header.isPlaceholder
                  ? ''
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body
            renderEmptyState={() =>
              isLoading ? null : <p className="py-8 text-center text-sm text-muted">{emptyMessage}</p>
            }
          >
            {/* Le squelette compte ses cellules sur les MEMES en-tetes que les lignes. */}
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                    {enTetes.map((h) => (
                      <Table.Cell key={`sq-${i}-${h.id}`}>
                        <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))
              : null}

            {(isLoading ? [] : rows).map((row) => (
              <Table.Row id={row.id} key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Table.Cell className={isFetching ? 'opacity-60' : undefined} key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
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
            <div key={`m-skel-${i}`} className="h-28 rounded-xl bg-surface-secondary animate-pulse" />
          ))
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted text-center py-10">{emptyMessage}</p>
        ) : (
          rows.map((row) => renderMobileCard(row))
        )}
        {pageCount > 1 && (
          <div className="flex justify-center pt-2">
            <PaginationTableau
              onPage={(page) => table.setPageIndex(page - 1)}
              page={table.getState().pagination.pageIndex + 1}
              total={pageCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
