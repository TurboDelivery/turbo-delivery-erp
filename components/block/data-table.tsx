'use client';

import React from 'react';
import { ColumnDef, flexRender, getCoreRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';

export interface PaginationState {
  pageCount: number;
  totalItems: number;
  page: number;
  handlePageChange: (page: number) => void;
}

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
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table isStriped>
            <TableHeader>
              {table.getFlatHeaders().map((header) => (
                <TableColumn
                  key={header.id}
                  className="text-primary"
                  allowsSorting={header.column.getCanSort()}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {Array.from({ length: colsCount }).map((_, j) => (
                      <TableCell key={`skeleton-cell-${j}`} className="h-12">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={colsCount} className="h-24 text-center">
                    <div className="text-destructive">Erreur lors du chargement des données</div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={isFetching ? 'opacity-70' : ''}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={colsCount} className="h-24 text-center">
                    Aucun résultat trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {pagination && pagination.pageCount > 1 && (
          <div className="flex justify-center pt-4 sm:pt-6">
            <Pagination
              total={pagination.pageCount}
              page={pagination.page + 1}
              onChange={pagination.handlePageChange}
              color="primary"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DataTable;