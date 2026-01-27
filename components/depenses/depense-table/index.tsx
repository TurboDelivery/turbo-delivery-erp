'use client';

import { useDepenseTable } from '@/features/depenses/hooks/use-depense-table';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { flexRender } from '@tanstack/react-table';
import { depenseColumns } from '@/components/depenses/depense-table/depense-columns';

export function DepenseTable() {
  const { table, filters, isLoading, isError, isFetching, pagination } = useDepenseTable();
  return (
    <Card>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table isStriped>
            <TableHeader>
              {table.getFlatHeaders().map((header) => (
                <TableColumn className="text-primary" key={header.id} allowsSorting={header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {depenseColumns.map((col) => (
                      <TableCell key={`skeleton-cell-${col.header}`} className="h-12">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={depenseColumns.length} className="h-24 text-center">
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
                  <TableCell colSpan={depenseColumns.length} className="h-24 text-center">
                    Aucun résultat trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {pagination?.pageCount! > 1 && (
          <div className="flex justify-center pt-4 sm:pt-6">
            <Pagination total={pagination?.pageCount ?? 1} page={filters.page + 1} onChange={pagination.handlePageChange} color="primary" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
