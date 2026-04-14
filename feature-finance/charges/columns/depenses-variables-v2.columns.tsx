'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button, Chip } from '@heroui/react';
import { Edit, Eye } from 'lucide-react';
import { IChargeVariable } from '../types/charge-variable.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { createUrlFile } from '@/utils/createUrlFile';
import { Can } from '@/components/auth/Can';

const STATUT_CONFIG: Record<string, { label: string; color: 'success' | 'warning' | 'danger' | 'primary' | 'default' }> = {
  EN_ATTENTE_DGA: { label: 'En attente', color: 'warning' },
  VALIDE_DGA: { label: 'Validé DGA', color: 'primary' },
  REJETE_DGA: { label: 'Rejeté', color: 'danger' },
  APPROUVE_DG: { label: 'Approuvé', color: 'success' },
  REJETE_DG: { label: 'Rejeté', color: 'danger' },
  DECAISSE: { label: 'Décaissé', color: 'success' },
};

type DepensesVariablesV2ColumnsOptions = {
  onEdit?: (charge: IChargeVariable) => void;
  onApprove?: (charge: IChargeVariable) => void;
  onReject?: (charge: IChargeVariable) => void;
  onViewJustificatif?: (url: string) => void;
};

export function createDepensesVariablesV2Columns({ onEdit, onApprove, onReject, onViewJustificatif }: DepensesVariablesV2ColumnsOptions): ColumnDef<IChargeVariable>[] {
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
      accessorKey: 'montant',
      header: 'Montant',
      cell: ({ row }) => <span className="text-sm font-medium text-gray-900">{formatCFA(row.getValue<number>('montant'))}</span>,
    },
    {
      accessorKey: 'dateDepense',
      header: 'Date',
      cell: ({ row }) => <span className="text-sm text-gray-600">{row.getValue<string>('dateDepense')}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Ajouter le',
      cell: ({ row }) => <span className="text-sm text-gray-600">{new Date(row.getValue<string>('createdAt')).toLocaleDateString('fr-FR')}</span>,
    },
    {
      id: 'justificatif',
      header: 'Justificatif',
      cell: ({ row }) => {
        const val = row.original.justificatif;
        if (!val) return <span className="text-sm text-gray-400">—</span>;
        const url = createUrlFile(val, 'backend');
        return (
          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700" onClick={() => onViewJustificatif?.(url)}>
            <Eye size={14} /> Voir
          </button>
        );
      },
    },
    {
      accessorKey: 'statut',
      header: 'Statut',
      cell: ({ row }) => {
        const statut = row.getValue<string>('statut');
        const config = STATUT_CONFIG[statut] ?? { label: statut, color: 'default' as const };
        return (
          <Chip color={config.color} variant="flat" size="sm">
            {config.label}
          </Chip>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const isEnAttente = row.original.statut === 'EN_ATTENTE_DGA';
        if (!isEnAttente) return null;
        return (
          <div className="flex items-center gap-1">
            <Can I="valider-dga" a="ChargeVariable">
              <Button isIconOnly size="sm" variant="light" onPress={() => onEdit?.(row.original)}>
                <Edit size={15} className="text-gray-500" />
              </Button>
            </Can>
          </div>
        );
      },
    },
  ];
}
