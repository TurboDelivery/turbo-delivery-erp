'use client';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { Edit, Trash2 } from 'lucide-react';
import { Switch } from '@heroui/react';

interface DepenseVariable {
  id: string;
  date: string;
  designation: string;
  amount: string;
  justificatif: string;
  enabled: boolean;
}

interface DepensesVariablesTableProps {
  data: DepenseVariable[];
}

export default function DepensesVariablesTable({ data }: DepensesVariablesTableProps) {
  const columns: ColumnDef<DepenseVariable>[] = [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-gray-700 text-sm">{row.getValue('date')}</span>
      ),
    },
    {
      accessorKey: 'designation',
      header: 'Désignation',
      cell: ({ row }) => (
        <span className="text-gray-900 font-medium text-sm">{row.getValue('designation')}</span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Montant',
      cell: ({ row }) => (
        <span className="text-gray-900 font-semibold text-sm">{row.getValue('amount')}</span>
      ),
    },
    {
      accessorKey: 'justificatif',
      header: 'Justificatif',
      cell: ({ row }) => (
        <span className="text-gray-400 text-sm">{row.getValue('justificatif')}</span>
      ),
    },
    {
      id: 'enabled',
      header: 'Statut',
      cell: () => (
        <Switch 
          size="sm"
          defaultSelected={true}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: () => (
        <div className="flex gap-2">
          <button className="text-blue-500 hover:text-blue-700 transition-colors">
            <Edit size={16} />
          </button>
          <button className="text-red-500 hover:text-red-700 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th 
                  key={header.id} 
                  className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
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
  );
}
