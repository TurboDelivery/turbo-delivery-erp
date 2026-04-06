'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button, Chip } from '@heroui/react';
import { Check, Edit, Eye, X } from 'lucide-react';
import { IDepense } from '@/features/depenses/types/depense.type';

const STATUT_CONFIG: Record<string, { label: string; color: 'success' | 'warning' | 'danger' | 'primary' | 'default' }> = {
  EN_ATTENTE: { label: 'En attente', color: 'warning' },
  PENDING: { label: 'En attente', color: 'warning' },
  APPROUVE: { label: 'Approuvé', color: 'success' },
  PAID: { label: 'Approuvé', color: 'success' },
  REJETE: { label: 'Rejeté', color: 'danger' },
};

type DepensesVariablesV2ColumnsOptions = {
  onEdit?: (depense: IDepense) => void;
  onApprove?: (depense: IDepense) => void;
  onReject?: (depense: IDepense) => void;
  onViewJustificatif?: (depense: IDepense) => void;
};

export function createDepensesVariablesV2Columns({
  onEdit,
  onApprove,
  onReject,
  onViewJustificatif,
}: DepensesVariablesV2ColumnsOptions): ColumnDef<IDepense>[] {
  return [
    {
      accessorKey: 'libelle',
      header: 'Désignation',
      cell: ({ row }) => <span className="text-sm text-gray-900">{row.getValue('libelle')}</span>,
    },
    {
      id: 'categorie',
      header: 'Catégorie',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.categorie?.nomCategorie ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'montant',
      header: 'Montant',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-900">
          {row.getValue<number>('montant').toLocaleString('fr-FR')} FCFA
        </span>
      ),
    },
    {
      accessorKey: 'dateDepense',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {new Date(row.getValue<string>('dateDepense')).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      id: 'justificatif',
      header: 'Justificatif',
      cell: ({ row }) => (
        <button
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          onClick={() => onViewJustificatif?.(row.original)}
        >
          <Eye size={14} /> Voir
        </button>
      ),
    },
    {
      accessorKey: 'statut',
      header: 'Statut',
      cell: ({ row }) => {
        const statut = row.getValue<string>('statut');
        const config = STATUT_CONFIG[statut] ?? { label: statut, color: 'default' as const };
        return <Chip color={config.color} variant="flat" size="sm">{config.label}</Chip>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const statut = row.original.statut;
        const isEnAttente = statut === 'EN_ATTENTE' || statut === 'PENDING';
        if (!isEnAttente) return null;

        return (
          <div className="flex items-center gap-1">
            <Button isIconOnly size="sm" variant="light" onPress={() => onEdit?.(row.original)}>
              <Edit size={15} className="text-gray-500" />
            </Button>
            <Button isIconOnly size="sm" variant="light" color="success" onPress={() => onApprove?.(row.original)}>
              <Check size={15} />
            </Button>
            <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => onReject?.(row.original)}>
              <X size={15} />
            </Button>
          </div>
        );
      },
    },
  ];
}
