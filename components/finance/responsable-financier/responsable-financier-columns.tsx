'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type StatutFacture = 'Soldé' | 'Acompte' | 'Déposé partenaire' | 'Recouvrement' | 'Validé' | 'Preuve ajoutée' | 'Visé DG' | 'À valider';

export interface IFactureRF {
  id: string;
  numero: string;
  partenaire: string;
  montant: number;
  montantRecouvre: number | null;
  pourcentageRecouvre: number | null;
  cycle: string;
  emission: string;
  depotPartenaire: { date: string; agent: string } | null;
  depotBanque: string | null;
  agent: string;
  statut: StatutFacture;
}

const statutConfig: Record<StatutFacture, { label: string; className: string }> = {
  'Soldé': { label: 'Soldé', className: 'bg-green-100 text-green-700 border-green-200' },
  'Acompte': { label: 'Acompte', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  'Déposé partenaire': { label: 'Déposé partenaire', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  'Recouvrement': { label: 'Recouvrement', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  'Validé': { label: 'Validé', className: 'bg-green-100 text-green-700 border-green-200' },
  'Preuve ajoutée': { label: 'Preuve ajoutée', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  'Visé DG': { label: 'Visé DG', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  'À valider': { label: 'À valider', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function formatMontant(v: number) {
  return new Intl.NumberFormat('fr-FR').format(v) + ' F CFA';
}

export function createResponsableFinancierColumns(
  onValider: (facture: IFactureRF) => void,
): ColumnDef<IFactureRF>[] {
  return [
  {
    accessorKey: 'numero',
    header: 'N° FACTURE',
    cell: ({ row }) => (
      <span className="font-medium text-red-500 cursor-pointer hover:underline text-sm">
        {row.original.numero}
      </span>
    ),
  },
  {
    accessorKey: 'partenaire',
    header: 'PARTENAIRE',
    cell: ({ row }) => <span className="text-sm font-medium">{row.original.partenaire}</span>,
  },
  {
    accessorKey: 'montant',
    header: 'MONTANT',
    cell: ({ row }) => (
      <span className="font-bold text-red-500 text-sm whitespace-nowrap">
        {formatMontant(row.original.montant)}
      </span>
    ),
  },
  {
    accessorKey: 'montantRecouvre',
    header: 'RECOUVRÉ',
    cell: ({ row }) => {
      const { montantRecouvre, pourcentageRecouvre } = row.original;
      if (!montantRecouvre) return <span className="text-gray-400">—</span>;
      return (
        <div className="flex flex-col gap-1">
          <span className="text-sm">{formatMontant(montantRecouvre)}</span>
          <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 text-xs px-2 py-0.5 w-fit font-medium">
            {pourcentageRecouvre}%
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'cycle',
    header: 'CYCLE',
    cell: ({ row }) => <span className="text-sm">{row.original.cycle}</span>,
  },
  {
    accessorKey: 'emission',
    header: 'ÉMISSION',
    cell: ({ row }) => <span className="text-sm">{row.original.emission}</span>,
  },
  {
    accessorKey: 'depotPartenaire',
    header: 'DÉPÔT PARTENAIRE',
    cell: ({ row }) => {
      const d = row.original.depotPartenaire;
      if (!d) return <span className="text-gray-400">—</span>;
      return (
        <div className="flex flex-col gap-1">
          <span className="text-sm">{d.date}</span>
          <span className="text-xs text-gray-500">{d.agent}</span>
          <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 text-xs px-2 py-0.5 w-fit font-medium">
            ✓ Preuve
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'depotBanque',
    header: 'DÉPÔT BANQUE',
    cell: ({ row }) => {
      const d = row.original.depotBanque;
      return d ? <span className="text-sm">{d}</span> : <span className="text-gray-400">—</span>;
    },
  },
  {
    accessorKey: 'agent',
    header: 'AGENT',
    cell: ({ row }) => <span className="text-sm">{row.original.agent}</span>,
  },
  {
    accessorKey: 'statut',
    header: 'STATUT',
    cell: ({ row }) => {
      const config = statutConfig[row.original.statut];
      return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
          {config.label}
        </span>
      );
    },
  },
  {
    id: 'actions',
    header: 'ACTIONS',
    cell: ({ row }) => {
      const { statut } = row.original;
      if (statut === 'Soldé' || statut === 'Acompte' || statut === 'Déposé partenaire' || statut === 'Visé DG' || statut === 'Preuve ajoutée') {
        return (
          <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 text-xs px-2" asChild>
            <Link href={`/finance/comptabilite/responsable-financier/${row.original.id}`}>
              Voir détail
            </Link>
          </Button>
        );
      }
      if (statut === 'Recouvrement') {
        return (
          <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-700 text-xs px-3">
            Lancer recouvrement →
          </Button>
        );
      }
      if (statut === 'Validé') {
        return (
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 border-green-300 hover:bg-green-50 text-xs px-3"
            onClick={() => onValider(row.original)}
          >
            ✓ Valider la facture
          </Button>
        );
      }
      if (statut === 'À valider') {
        return (
          <Button
            size="sm"
            className="bg-green-600 text-white hover:bg-green-700 text-xs px-3"
            onClick={() => onValider(row.original)}
          >
            ✓ Valider la facture
          </Button>
        );
      }
      return null;
    },
  },
  ];
}
