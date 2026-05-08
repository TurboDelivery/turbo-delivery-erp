'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2 } from 'lucide-react';
import { Switch } from '@heroui/react';
import { IChargeFixe, CyclePaiement } from '../types/charge-fixe.type';
import { formatCfa } from '@/utils/format.utils';
import { format } from 'date-fns';
import { Can } from '@/components/auth/Can';

const CYCLE_LABELS: Record<CyclePaiement, string> = {
  MENSUEL: 'Mensuel',
  TRIMESTRIEL: 'Trimestriel',
  SEMESTRIEL: 'Semestriel',
  ANNUEL: 'Annuel',
};

type ChargesFixesV2ColumnsOptions = {
  onEdit?: (charge: IChargeFixe) => void;
  onDelete?: (charge: IChargeFixe) => void;
  onToggle?: (charge: IChargeFixe, enabled: boolean) => void;
};

export function createChargesFixesV2Columns({ onEdit, onDelete, onToggle }: ChargesFixesV2ColumnsOptions = {}): ColumnDef<IChargeFixe>[] {
  return [
    {
      accessorKey: 'designation',
      header: 'Désignation',
      cell: ({ row }) => <span className="text-sm text-gray-900">{row.getValue('designation')}</span>,
    },
    {
      id: 'categorie',
      header: 'Catégorie',
      cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.categorie?.nomCategorie ?? '—'}</span>,
    },
    {
      accessorKey: 'cyclePaiement',
      header: 'Cycle',
      cell: ({ row }) => <span className="text-sm text-gray-600">{CYCLE_LABELS[row.getValue<CyclePaiement>('cyclePaiement')] ?? row.getValue('cyclePaiement')}</span>,
    },
    {
      accessorKey: 'montant',
      header: 'Montant',
      cell: ({ row }) => <span className="text-sm font-medium text-gray-900">{formatCfa(row.getValue<number>('montant'))}</span>,
    },
    {
      id: 'tauxJournalier',
      header: 'Taux Journalier',
      cell: ({ row }) => <span className="text-sm text-gray-600">{formatCfa(Math.round(row.original.montant / 30))}</span>,
    },
    {
      id: 'consomme',
      header: 'Consommé',
      cell: ({ row }) => {
        return <span className="text-sm font-medium text-orange-500">{formatCfa(row.original.montantConsomme)}</span>;
      },
    },
    {
      accessorKey: 'dateEcheance',
      header: 'Échéance',
      cell: ({ row }) => {
        return <span className="text-sm text-gray-600">{format(row.original.dateEcheance, 'dd/MM/yyyy')}</span>;
      },
    },
    {
      id: 'enabled',
      header: 'Activer',
      cell: ({ row }) => {
        if (row.original.automatique) {
          return <span className="text-xs text-green-600 font-medium">Automatique</span>;
        }
        return <Switch size="sm" isSelected={row.original.enable} onValueChange={(enabled) => onToggle?.(row.original, enabled)} />;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        if (row.original.automatique) {
          return <span className="text-sm text-gray-400">—</span>;
        }
        return (
          <div className="flex gap-2">
            <Can I="update" a="ChargeFixe">
              <button className="text-blue-500 transition-colors hover:text-blue-700" onClick={() => onEdit?.(row.original)} title="Modifier" type="button">
                <Edit size={16} />
              </button>
            </Can>
            <Can I="delete" a="ChargeFixe">
              <button className="text-red-500 transition-colors hover:text-red-700" onClick={() => onDelete?.(row.original)} title="Supprimer" type="button">
                <Trash2 size={16} />
              </button>
            </Can>
          </div>
        );
      },
    },
  ];
}
