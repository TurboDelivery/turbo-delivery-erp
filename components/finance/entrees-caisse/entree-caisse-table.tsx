'use client';

import { flexRender } from '@tanstack/react-table';
import type { Table } from '@tanstack/react-table';
import {
  Pagination,
  Table as HeroTable,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import type { IEntreeCaisse } from '@/features/entrees-caisse/types/entree-caisse.types';

interface EntreeCaisseTableProps {
  table: Table<IEntreeCaisse>;
  isLoading: boolean;
  isFetching: boolean;
  pagination: {
    pageCount: number;
    page: number;
    handlePageChange: (page: number) => void;
  };
}

export function EntreeCaisseTable({
  table,
  isLoading,
  isFetching,
  pagination,
}: EntreeCaisseTableProps) {
  const colsCount = table.getAllColumns().length;

  return (
    <div className="overflow-x-auto">
      <HeroTable
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
                <TableRow key={row.id} className={isFetching ? 'opacity-70' : ''}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </HeroTable>
    </div>
  );
}
