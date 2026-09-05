'use client';

import React from 'react';
import { ColumnDef, flexRender, getCoreRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { Card, Table } from '@heroui-v3/react';

import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';

export interface PaginationState {
  pageCount: number;
  totalItems: number;
  page: number;
  handlePageChange: (page: number) => void;
}

/**
 * Un tableau generique : colonnes, donnees, tri, pagination.
 *
 * <p>⚠ AUCUN ecran ne le rend aujourd'hui — seul son type `PaginationState` est importe,
 * par `hooks/use-generic-table`. Il est passe en v3 pour que le projet n'ait qu'un seul
 * vocabulaire de tableau, mais il n'a pas ete verifie a l'ecran, faute d'ecran ou le voir.
 * Le tableau de reference reste
 * `components/finance/recouvrements/factures/facture-table.tsx`.</p>
 */
export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  isFetching?: boolean;
  pagination?: PaginationState;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  manualPagination?: boolean;
  manualSorting?: boolean;
  pageSize?: number;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  isError = false,
  isFetching = false,
  pagination,
  sorting = [],
  onSortingChange,
  manualPagination = true,
  manualSorting = true,
  pageSize = 50,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(sorting);

  React.useEffect(() => {
    setInternalSorting(sorting);
  }, [sorting]);

  const handleSortingChange = React.useCallback(
    (updater: ((old: SortingState) => SortingState) | SortingState) => {
      const newSorting = typeof updater === 'function' ? updater(internalSorting) : updater;
      setInternalSorting(newSorting);
      onSortingChange?.(newSorting);
    },
    [internalSorting, onSortingChange],
  );

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    manualPagination,
    manualSorting,
    state: {
      sorting: internalSorting,
      ...(pagination && {
        pagination: {
          pageIndex: pagination.page,
          pageSize,
        },
      }),
    },
    onSortingChange: handleSortingChange,
  });

  const colsCount = columns.length;

  return (
    <Card>
      <Card.Content className="p-0">
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Données">
              <Table.Header>
                {table.getFlatHeaders().map((header, i) => (
                  <Table.Column
                    allowsSorting={header.column.getCanSort()}
                    id={header.id}
                    isRowHeader={i === 0}
                    key={header.id}
                  >
                    {({ sortDirection }) =>
                      header.column.getCanSort() ? (
                        <Table.SortableColumnHeader sortDirection={sortDirection}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </Table.SortableColumnHeader>
                      ) : (
                        <>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </>
                      )
                    }
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body
                renderEmptyState={() =>
                  isLoading ? null : isError ? (
                    /*
                     * L'echec passait par une `<TableCell colSpan>` — or la v3 rend un
                     * `<table role="grid">` qui n'expose PAS `colSpan` : une cellule de
                     * moins que de colonnes fait lever « Cell count must match column
                     * count » a react-aria, et la page entiere tombe en 500. L'etat vide
                     * du corps est l'emplacement prevu pour ces messages.
                     */
                    <p className="py-8 text-center text-sm text-danger-soft-foreground">
                      Erreur lors du chargement des données
                    </p>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted">Aucun résultat trouvé</p>
                  )
                }
              >
                {isLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <Table.Row id={`skeleton-${i}`} key={`skeleton-${i}`}>
                        {Array.from({ length: colsCount }).map((_, j) => (
                          <Table.Cell className="h-12" key={`skeleton-cell-${j}`}>
                            {/* Le gabarit n'avait PAS d'animation : dix rangees de barres
                                grises immobiles se lisent comme des lignes vides. */}
                            <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))
                  : isError
                    ? []
                    : table.getRowModel().rows.map((row) => (
                        <Table.Row
                          className={isFetching ? 'opacity-70' : undefined}
                          id={row.id}
                          key={row.id}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <Table.Cell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
          {pagination && pagination.pageCount > 1 && (
            <Table.Footer>
              <PaginationTableau
                onPage={pagination.handlePageChange}
                page={pagination.page + 1}
                total={pagination.pageCount}
              />
            </Table.Footer>
          )}
        </Table>
      </Card.Content>
    </Card>
  );
}

export default DataTable;