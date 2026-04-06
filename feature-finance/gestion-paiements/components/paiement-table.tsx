'use client';

import { flexRender, Table } from '@tanstack/react-table';
import { Pagination } from '@heroui/react';

interface PaiementTableProps<T> {
  table: Table<T>;
  isLoading?: boolean;
  isFetching?: boolean;
  pageCount?: number;
  emptyMessage?: string;
}

export default function PaiementTable<T>({ table, isLoading, isFetching, pageCount = 0, emptyMessage = 'Aucune donnée' }: PaiementTableProps<T>) {
  if (isLoading) {
    return <div className="py-12 text-center text-sm text-gray-500">Chargement...</div>;
  }

  if (table.getRowModel().rows.length === 0) {
    return <div className="py-12 text-center text-sm text-gray-400">{emptyMessage}</div>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${isFetching ? 'opacity-60' : ''}`}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex justify-center py-4 border-t">
          <Pagination
            total={pageCount}
            page={table.getState().pagination.pageIndex + 1}
            onChange={(page) => table.setPageIndex(page - 1)}
            color="primary"
            isDisabled={isFetching}
          />
        </div>
      )}
    </div>
  );
}
