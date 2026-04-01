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
import { IChargeFixe, CyclePaiement } from '../types/charge-fixe.type';

const CYCLE_LABELS: Record<CyclePaiement, string> = {
  MENSUEL: 'Tous les mois',
  TRIMESTRIEL: 'Tous les trimestres',
  SEMESTRIEL: 'Tous les semestres',
  ANNUEL: 'Tous les ans',
};

const CYCLE_DAYS: Record<CyclePaiement, number> = {
  MENSUEL: 30,
  TRIMESTRIEL: 90,
  SEMESTRIEL: 180,
  ANNUEL: 365,
};

function formatMontant(value: number): string {
  return value.toLocaleString('fr-FR');
}

interface ChargesFixesTableProps {
  data: IChargeFixe[];
  isLoading?: boolean;
  onEdit?: (charge: IChargeFixe) => void;
  onDelete?: (charge: IChargeFixe) => void;
}

export default function ChargesFixesTable({ data, isLoading, onEdit, onDelete }: ChargesFixesTableProps) {
  const columns: ColumnDef<IChargeFixe>[] = [
    {
      accessorKey: 'designation',
      header: 'Désignation',
      cell: ({ row }) => (
        <p className="font-semibold text-gray-900 text-sm">{row.getValue('designation')}</p>
      ),
    },
    {
      id: 'category',
      header: 'Catégorie',
      cell: ({ row }) => (
        <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
          {row.original.categorie?.nomCategorie ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'cyclePaiement',
      header: 'Cycle de paiement',
      cell: ({ row }) => {
        const cycle = row.getValue<CyclePaiement>('cyclePaiement');
        return <span className="text-gray-700 text-sm">{CYCLE_LABELS[cycle] ?? cycle}</span>;
      },
    },
    {
      accessorKey: 'montant',
      header: 'Montant (FCFA)',
      cell: ({ row }) => (
        <span className="text-gray-900 font-semibold text-sm">
          {formatMontant(row.getValue<number>('montant'))}
        </span>
      ),
    },
    {
      id: 'tauxJournalier',
      header: 'Taux journalier',
      cell: ({ row }) => {
        const cycle = row.original.cyclePaiement;
        const days = CYCLE_DAYS[cycle] ?? 30;
        const tauxJour = Math.round(row.original.montant / days);
        return (
          <span className="text-blue-600 font-semibold text-sm">
            {formatMontant(tauxJour)} FCFA/j
          </span>
        );
      },
    },
    {
      accessorKey: 'echeanceJour',
      header: 'Échéance',
      cell: ({ row }) => (
        <span className="text-gray-700 text-sm">Jour {row.getValue('echeanceJour')}</span>
      ),
    },
    {
      id: 'enabled',
      header: 'Statut',
      cell: ({ row }) => {
        if (row.original.automatique) {
          return (
            <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">
              Automatique
            </span>
          );
        }
        return <Switch size="sm" defaultSelected={true} />;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        if (row.original.automatique) {
          return <span className="text-gray-400 text-sm">—</span>;
        }
        return (
          <div className="flex gap-2">
            <button
              className="text-blue-500 hover:text-blue-700 transition-colors"
              onClick={() => onEdit?.(row.original)}
              title="Modifier"
            >
              <Edit size={16} />
            </button>
            <button
              className="text-red-500 hover:text-red-700 transition-colors"
              onClick={() => onDelete?.(row.original)}
              title="Supprimer"
            >
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

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        Chargement des charges fixes…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        Aucune charge fixe configurée.
      </div>
    );
  }

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
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={
                row.original.automatique ? 'bg-green-50/60' : 'hover:bg-gray-50 transition-colors'
              }
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
