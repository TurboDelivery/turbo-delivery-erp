'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Switch } from '@heroui/react';
import { IChargeFixe, CyclePaiement } from '../types/charge-fixe.type';

const CYCLE_LABELS: Record<CyclePaiement, string> = {
  MENSUEL: 'Mensuel',
  TRIMESTRIEL: 'Trimestriel',
  SEMESTRIEL: 'Semestriel',
  ANNUEL: 'Annuel',
};

function formatMontant(value: number): string {
  return `${value.toLocaleString('fr-FR')} FCFA`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

type Options = {
  onToggle?: (charge: IChargeFixe, enabled: boolean) => void;
};

export function createChargesFixesDetailsColumns({ onToggle }: Options = {}): ColumnDef<IChargeFixe>[] {
  return [
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
      accessorKey: 'cyclePaiement',
      header: 'Cycle',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {CYCLE_LABELS[row.getValue<CyclePaiement>('cyclePaiement')] ?? row.getValue('cyclePaiement')}
        </span>
      ),
    },
    {
      accessorKey: 'montant',
      header: 'Montant',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-900">{formatMontant(row.getValue<number>('montant'))}</span>
      ),
    },
    {
      id: 'tauxJournalier',
      header: 'Taux Journalier',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{formatMontant(Math.round(row.original.montant / 30))}</span>
      ),
    },
    {
      id: 'consomme',
      header: 'Consommé',
      cell: ({ row }) => {
        const today = new Date();
        const jourDuMois = today.getDate();
        const consomme = Math.round((row.original.montant / 30) * jourDuMois);
        return <span className="text-sm font-medium text-orange-500">{formatMontant(consomme)}</span>;
      },
    },
    {
      accessorKey: 'echeanceJour',
      header: 'Échéance',
      cell: ({ row }) => {
        const today = new Date();
        const echeance = new Date(today.getFullYear(), today.getMonth(), row.getValue<number>('echeanceJour'));
        return <span className="text-sm text-gray-600">{formatDate(echeance.toISOString())}</span>;
      },
    },
    {
      id: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <Switch
          size="sm"
          defaultSelected={!row.original.automatique}
          onValueChange={(enabled) => onToggle?.(row.original, enabled)}
        />
      ),
    },
  ];
}
