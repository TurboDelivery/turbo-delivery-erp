'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Chip } from '@heroui/react';
import { Clock, Loader2, CheckCircle } from 'lucide-react';
import { IPaiement, StatutPaiement } from '../types/paiement.type';

const STATUT_CONFIG: Record<StatutPaiement, { label: string; color: 'warning' | 'primary' | 'success'; icon: typeof Clock }> = {
  EN_ATTENTE: { label: 'En attente', color: 'warning', icon: Clock },
  EN_COURS: { label: 'En cours', color: 'primary', icon: Loader2 },
  TERMINE: { label: 'Terminé', color: 'success', icon: CheckCircle },
};

function ProgressionDots({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2, 3].map((step) => (
        <div
          key={step}
          className={`w-6 h-1.5 rounded-full ${
            step < value ? 'bg-orange-400' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

type PaiementsColumnsOptions = {
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
};

export function createPaiementsColumns({ selectedIds, onToggleSelect }: PaiementsColumnsOptions): ColumnDef<IPaiement>[] {
  return [
    {
      id: 'select',
      header: () => (
        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
      ),
      cell: ({ row }) => {
        const isSelected = selectedIds.has(row.original.id);
        return (
          <button
            onClick={() => onToggleSelect(row.original.id)}
            className={`w-5 h-5 rounded-full border-2 transition-colors ${
              isSelected ? 'border-orange-500 bg-orange-500' : 'border-orange-300 hover:border-orange-400'
            }`}
          >
            {isSelected && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </button>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'designation',
      header: 'Désignation',
      cell: ({ row }) => <span className="text-sm text-gray-900">{row.getValue('designation')}</span>,
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
      accessorKey: 'statut',
      header: 'Statut',
      cell: ({ row }) => {
        const statut = row.getValue<StatutPaiement>('statut');
        const config = STATUT_CONFIG[statut] ?? STATUT_CONFIG.EN_ATTENTE;
        const Icon = config.icon;
        return (
          <Chip
            color={config.color}
            variant="flat"
            size="sm"
            startContent={<Icon size={12} />}
          >
            {config.label}
          </Chip>
        );
      },
    },
    {
      id: 'progression',
      header: 'Progression',
      cell: ({ row }) => <ProgressionDots value={row.original.progression} />,
    },
    {
      id: 'action',
      header: 'Action',
      cell: () => null, // TODO: Actions quand le backend sera prêt
    },
  ];
}
