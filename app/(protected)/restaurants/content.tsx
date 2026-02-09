'use client';

import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { Input, Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { Search } from 'lucide-react';
import { title } from '@/components/primitives';
import { useRestaurantTable } from '@/features/restaurants/hooks/use-restaurant-table';

export default function Content() {
  const { table, isLoading, pagination, filters, setSearch } = useRestaurantTable();

  const colsCount = table.getAllColumns().length;

  return (
    <div className="w-full h-full pb-10 flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className={title({ size: 'h3', class: 'text-primary' })}>Restaurants</h1>
      </div>

      {/* Champ de recherche */}
      <Input
        startContent={<Search className="text-gray-500 w-4 h-4" />}
        placeholder="Rechercher par nom de restaurant..."
        value={filters.search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-1/2 mb-4"
      />

      <div className="overflow-x-auto">
        <Table
          aria-label="Liste des restaurants"
          isStriped
          bottomContent={
            pagination &&
            pagination.pageCount > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination total={pagination.pageCount} page={pagination.page + 1} onChange={pagination.handlePageChange} isDisabled={isLoading} />
              </div>
            )
          }
        >
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableColumn key={header.id} className="text-primary" allowsSorting={header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent={'Aucun restaurant trouvé.'}>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {Array.from({ length: colsCount }).map((_, j) => (
                      <TableCell key={`skeleton-cell-${j}`} className="h-12">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
