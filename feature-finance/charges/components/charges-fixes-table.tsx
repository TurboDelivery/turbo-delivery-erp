'use client';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { 
  Users, 
  Building2, 
  Wifi, 
  Zap, 
  Car,
  Edit,
  Trash2
} from 'lucide-react';
import { Switch } from '@heroui/react';

interface ChargeFixe {
  id: string;
  name: string;
  description?: string;
  category: string;
  categoryColor: string;
  cycle: string;
  amount: string;
  tauxJournalier: string;
  cumulMensuel: string;
  dueDate: string;
  status: string;
  statusColor: string;
  isAutomatic?: boolean;
}

interface ChargesFixesTableProps {
  data: ChargeFixe[];
}

export default function ChargesFixesTable({ data }: ChargesFixesTableProps) {
  const columns: ColumnDef<ChargeFixe>[] = [
    {
      accessorKey: 'name',
      header: 'Désignation',
      cell: ({ row }) => {
        return (
          <div>
            <p className="font-semibold text-gray-900 text-sm">{row.getValue('name')}</p>
            {row.original.description && (
              <p className="text-xs text-green-700 mt-0.5">{row.original.description}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Catégorie',
      cell: ({ row }) => (
        <span className={`${row.original.categoryColor} px-2.5 py-1 rounded-full text-xs font-medium`}>
          {row.getValue('category')}
        </span>
      ),
    },
    {
      accessorKey: 'cycle',
      header: 'Cycle de paiement',
      cell: ({ row }) => (
        <span className="text-gray-700 text-sm">{row.getValue('cycle')}</span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Montant (FCFA)',
      cell: ({ row }) => (
        <span className="text-gray-900 font-semibold text-sm">{row.getValue('amount')}</span>
      ),
    },
    {
      accessorKey: 'tauxJournalier',
      header: 'Taux journalier',
      cell: ({ row }) => (
        <div>
          <p className={`${row.original.isAutomatic ? 'text-green-600' : 'text-blue-600'} font-semibold text-sm`}>
            {row.original.tauxJournalier}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{row.original.cumulMensuel}</p>
        </div>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: 'Échéance',
      cell: ({ row }) => (
        <span className="text-gray-700 text-sm">{row.getValue('dueDate')}</span>
      ),
    },
    {
      id: 'enabled',
      header: 'Statut',
      cell: ({ row }) => {
        if (row.original.isAutomatic) {
          return (
            <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">
              Automatique
            </span>
          );
        }
        return (
          <Switch 
            size="sm"
            defaultSelected={true}
          />
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        if (row.original.isAutomatic) {
          return <span className="text-gray-400 text-sm">—</span>;
        }
        return (
          <div className="flex gap-2">
            <button className="text-blue-500 hover:text-blue-700 transition-colors">
              <Edit size={16} />
            </button>
            <button className="text-red-500 hover:text-red-700 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        );
      },
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
            <tr 
              key={row.id} 
              className={row.original.isAutomatic ? "bg-green-50/60" : "hover:bg-gray-50 transition-colors"}
            >
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
