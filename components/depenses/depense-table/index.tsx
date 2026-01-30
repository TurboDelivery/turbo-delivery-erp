'use client';

import { useDepenseTable } from '@/features/depenses/hooks/use-depense-table';
import { depenseColumns } from '@/components/depenses/depense-table/depense-columns';
import { CreerDepenseModal } from '@/feature-finance/depenses/components/depense-list/creer-depense';
import Select from 'react-select';
import React from 'react';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';
import { Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { flexRender } from '@tanstack/react-table';
import { Card, CardContent } from '@/components/ui/card';

export function DepenseTable() {
  const { table, isLoading, isFetching, pagination, filters, setSelectedCategories } = useDepenseTable();
  const { categories, isLoading: isLoadingCategory } = useCategorieDepense();
  const categorieOptions = categories.map((cat) => ({ value: cat.id, label: cat.nomCategorie }));

  return (
    <Card className="flex flex-col gap-4">
      <CardContent>
        <div className="overflow-x-auto">
          <Table
            isStriped
            topContent={
              <div className="flex justify-between py-2">
                <Select
                  isMulti
                  options={categorieOptions}
                  value={categorieOptions.filter((opt) => filters.categoriesDepense?.includes(opt.value))}
                  isClearable
                  onChange={(opt) => {
                    const selectedIds = opt ? opt.map((o) => o.value) : [];
                    setSelectedCategories(selectedIds);
                  }}
                  placeholder="Choisir une catégorie..."
                  className="text-xs w-full max-w-lg"
                  classNamePrefix="react-select"
                  isLoading={isLoadingCategory}
                />
                <CreerDepenseModal />
              </div>
            }
            bottomContent={
              pagination?.pageCount! > 1 && (
                <div className="flex justify-center pt-4 sm:pt-6">
                  <Pagination total={pagination?.pageCount ?? 1} page={filters.page + 1} onChange={pagination.handlePageChange} color="primary" />
                </div>
              )
            }
          >
            <TableHeader>
              {table.getFlatHeaders().map((header) => (
                <TableColumn className="text-primary" key={header.id} allowsSorting={header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {depenseColumns.map((col) => (
                        <TableCell key={`skeleton-cell-${col.header}`} className="h-12">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={isFetching ? 'opacity-70' : ''}>
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
