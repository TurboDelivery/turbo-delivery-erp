'use client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { flexRender } from '@tanstack/react-table';
import React from 'react';
import { restaurantRecouvrementTableColumns } from '@/components/finance/recouvrements/restaurants/restaurant-recouvrement-table-columns';
import useRestaurantRecouvrementTable from '@/features/recouvrements/hooks/use-restaurant-recouvrement-table';
import Select from 'react-select';

export type restaurantsTableProps = {
  restoOpts: {
    label: string;
    value: string;
  }[];
};

export function RestaurantsTable({ restoOpts }: restaurantsTableProps) {
  const { restaurantTable, isRestaurantLoading, isRestaurantFetching, pagination, filters, handleRestaurantFilterChange } = useRestaurantRecouvrementTable();
  return (
    <Card className="flex flex-col gap-4">
      <CardHeader>
        <div className="flex flex-row gap-2 flex-wrap items-center justify-between">
          <h2 className="text-lg font-medium">Liste des restaurants ({pagination?.totalItems ?? 0})</h2>
          <Select
            options={restoOpts}
            value={restoOpts.find((o) => o.value === filters.restoId) ?? null}
            onChange={(opt) => handleRestaurantFilterChange(opt?.value)}
            placeholder="Restaurant"
            isClearable
            className="text-xs w-full max-w-md"
            classNamePrefix="react-select"
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '36px',
                height: '36px',
                width: '100%',
              }),
              valueContainer: (base) => ({
                ...base,
                height: '36px',
                padding: '0 8px',
              }),
              indicatorsContainer: (base) => ({
                ...base,
                height: '36px',
              }),
            }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table
            isStriped
            bottomContent={
              pagination?.pageCount! > 1 && (
                <div className="flex justify-center pt-4 sm:pt-6">
                  <Pagination total={pagination?.pageCount ?? 1} page={filters.page + 1} onChange={pagination.handlePageChange} color="primary" />
                </div>
              )
            }
          >
            <TableHeader>
              {restaurantTable.getFlatHeaders().map((header) => (
                <TableColumn className="text-primary" key={header.id} allowsSorting={header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody>
              {isRestaurantLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {restaurantRecouvrementTableColumns.map((col) => (
                        <TableCell key={`skeleton-cell-${col.header}`} className="h-12">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : restaurantTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={isRestaurantFetching ? 'opacity-70' : ''}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
