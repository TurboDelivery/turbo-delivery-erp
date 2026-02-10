'use client';

import React from 'react';
import { useRecouvrementTable } from '@/features/recouvrements/hooks/use-recouvrement-table';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/table';
import { Pagination } from '@heroui/react';
import { flexRender } from '@tanstack/react-table';
import { RestaurantSelect } from '../common/restaurant-select';

interface RecouvrementTableProps {
  restoOpts: Array<{ value: string; label: string }>;
  isOptionsLoading?: boolean;
}

export function RecouvrementTable({ restoOpts, isOptionsLoading }: RecouvrementTableProps) {
  const { table, isLoading, isFetching, filters, setFilters, pagination, colsCount } = useRecouvrementTable();

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <RestaurantSelect
          value={filters.restaurantId}
          onChange={(value) => setFilters({ restaurantId: value || '', page: 0 })}
          options={restoOpts}
          isLoading={isOptionsLoading}
          placeholder="Tous les restaurants"
          className="w-full sm:w-[280px]"
        />
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <Table isStriped>
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableColumn key={header.id} className="text-primary" allowsSorting={header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent={"Aucun résultat trouvé"}>
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
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={isFetching ? 'opacity-70' : ''}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && pagination.pageCount > 1 && (
        <div className="flex justify-center pt-4 sm:pt-6">
          <Pagination total={pagination.pageCount} page={pagination.page + 1} onChange={pagination.handlePageChange} color="primary" />
        </div>
      )}
    </div>
  );
}
