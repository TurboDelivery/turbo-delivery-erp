'use client';

import { flexRender } from '@tanstack/react-table';
import {
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { useEntreeCaisseTable } from '@/features/entrees-caisse/hooks/use-entree-caisse-table';
import { EntreeCaisseFilters } from './entree-caisse-filters';
import { CreerEntreeCaisseModal } from './creer-entree-caisse-modal';

export function EntreeCaisseTable() {
  const {
    table,
    isLoading,
    isFetching,
    pagination,
    filters,
    handleSearchChange,
    handleDateChange,
    handleReset,
  } = useEntreeCaisseTable();

  const colsCount = table.getAllColumns().length;

  return (
    <div className="space-y-4">
      <EntreeCaisseFilters
        filters={filters}
        handleSearchChange={handleSearchChange}
        handleDateChange={handleDateChange}
        handleReset={handleReset}
      />
      <div className="flex justify-end">
        <CreerEntreeCaisseModal />
      </div>
      <div className="overflow-x-auto">
        <Table
          isStriped
          bottomContent={
            pagination.pageCount > 1 ? (
              <div className="flex justify-center pt-4">
                <Pagination
                  total={pagination.pageCount}
                  page={pagination.page + 1}
                  onChange={pagination.handlePageChange}
                  color="primary"
                />
              </div>
            ) : null
          }
        >
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableColumn key={header.id} className="text-primary">
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent="Aucune entrée caisse trouvée">
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {Array.from({ length: colsCount }).map((_, j) => (
                      <TableCell key={`cell-${j}`}>
                        <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={isFetching ? 'opacity-70' : ''}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
