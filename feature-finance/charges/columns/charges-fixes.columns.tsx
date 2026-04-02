'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2 } from 'lucide-react';
import { Switch } from '@heroui/react';
import { CyclePaiement, IChargeFixe } from '../types/charge-fixe.type';

const CYCLE_LABELS: Record<CyclePaiement, string> = {
  MENSUEL: 'Tous les mois',
  TRIMESTRIEL: 'Tous les trimestres',
  SEMESTRIEL: 'Tous les semestres',
  ANNUEL: 'Tous les ans',
};

function formatMontant(value: number): string {
  return value.toLocaleString('fr-FR');
}

type ChargesFixesColumnsOptions = {
  onEdit?: (charge: IChargeFixe) => void;
  onDelete?: (charge: IChargeFixe) => void;
};

export function createChargesFixesColumns({ onEdit, onDelete }: ChargesFixesColumnsOptions): ColumnDef<IChargeFixe>[] {
  return [
    {
      accessorKey: 'designation',
      header: 'Designation',
      cell: ({ row }) => <p className="text-sm font-semibold text-gray-900">{row.getValue('designation')}</p>,
    },
    {
      id: 'category',
      header: 'Categorie',
      cell: ({ row }) => (
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
          {row.original.categorie?.nomCategorie ?? '-'}
        </span>
      ),
    },
    {
      accessorKey: 'cyclePaiement',
      header: 'Cycle de paiement',
      cell: ({ row }) => {
        const cycle = row.getValue<CyclePaiement>('cyclePaiement');
        return <span className="text-sm text-gray-700">{CYCLE_LABELS[cycle] ?? cycle}</span>;
      },
    },
    {
      accessorKey: 'montant',
      header: 'Montant (FCFA)',
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-gray-900">{formatMontant(row.getValue<number>('montant'))}</span>
      ),
    },
    {
      id: 'tauxJournalier',
      header: 'Taux journalier',
      cell: ({ row }) => {
        const tauxJournalier = Math.round(row.original.montant / 30);
        return <span className="text-sm font-semibold text-blue-600">{formatMontant(tauxJournalier)} FCFA/j</span>;
      },
    },
    {
      accessorKey: 'echeanceJour',
      header: 'Echeance',
      cell: ({ row }) => <span className="text-sm text-gray-700">{row.getValue('echeanceJour')}</span>,
    },
    {
      id: 'enabled',
      header: 'Statut',
      cell: ({ row }) => {
        if (row.original.automatique) {
          return (
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
              Automatique
            </span>
          );
        }
        return <Switch size="sm" defaultSelected />;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        if (row.original.automatique) {
          return <span className="text-sm text-gray-400">-</span>;
        }

        return (
          <div className="flex gap-2">
            <button
              className="text-blue-500 transition-colors hover:text-blue-700"
              onClick={() => onEdit?.(row.original)}
              title="Modifier"
              type="button"
            >
              <Edit size={16} />
            </button>
            <button
              className="text-red-500 transition-colors hover:text-red-700"
              onClick={() => onDelete?.(row.original)}
              title="Supprimer"
              type="button"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      },
    },
  ];
}

