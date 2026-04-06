'use client';

import { flexRender, Table } from '@tanstack/react-table';
import { Card } from '@heroui/react';

interface ChargesTableV2Props<T> {
  table: Table<T>;
  isLoading?: boolean;
  emptyMessage?: string;
}

export default function ChargesTableV2<T>({ table, isLoading, emptyMessage = 'Aucune donnée' }: ChargesTableV2Props<T>) {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">Chargement...</div>
    );
  }

  if (table.getRowModel().rows.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">{emptyMessage}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="text-left text-xs font-medium text-gray-500 px-4 py-3"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-100">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3.5">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
