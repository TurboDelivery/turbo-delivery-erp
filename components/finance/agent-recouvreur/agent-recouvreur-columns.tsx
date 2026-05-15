'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ClipboardList, RefreshCw, Banknote, Landmark } from 'lucide-react';
import type { IFactureAgent, StatutAgentFacture } from './mock-data';

const statutConfig: Record<StatutAgentFacture, { label: string; className: string }> = {
  'Recouvrement': { label: 'Recouvrement', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  'Déposé partenaire': { label: 'Déposé partenaire', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  'Soldé': { label: 'Soldé', className: 'bg-green-100 text-green-700 border-green-200' },
  'Visé DG': { label: 'Visé DG', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  'Preuve ajoutée': { label: 'Preuve ajoutée', className: 'bg-red-100 text-red-700 border-red-200' },
};

function formatMontant(v: number) {
  return new Intl.NumberFormat('fr-FR').format(v) + ' F CFA';
}

export function createAgentRecouvreurColumns(
  onDepotPartenaire: (facture: IFactureAgent) => void,
  onAjouterPreuve: (facture: IFactureAgent) => void,
  onEncaisser: (facture: IFactureAgent) => void,
  onVerserComptable: (facture: IFactureAgent) => void,
): ColumnDef<IFactureAgent>[] {
  return [
    {
      accessorKey: 'numero',
      header: 'N° FACTURE',
      cell: ({ row }) => (
        <span className="font-medium text-red-500 text-xs whitespace-nowrap">
          {row.original.numero}
        </span>
      ),
    },
    {
      accessorKey: 'partenaire',
      header: 'PARTENAIRE',
      cell: ({ row }) => (
        <span className="text-xs font-medium text-gray-800">{row.original.partenaire}</span>
      ),
    },
    {
      accessorKey: 'montant',
      header: 'MONTANT',
      cell: ({ row }) => (
        <span className="font-bold text-red-500 text-xs whitespace-nowrap">
          {formatMontant(row.original.montant)}
        </span>
      ),
    },
    {
      accessorKey: 'montantRecouvre',
      header: 'RECOUVRÉ',
      cell: ({ row }) => {
        const { montantRecouvre, pourcentageRecouvre } = row.original;
        if (!montantRecouvre) return <span className="text-gray-400 text-xs">—</span>;
        return (
          <div className="flex flex-col gap-1">
            <span className="text-xs">{formatMontant(montantRecouvre)}</span>
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
      cell: ({ row }) => <span className="text-xs">{row.original.cycle}</span>,
    },
    {
      accessorKey: 'emission',
      header: 'ÉMISSION',
      cell: ({ row }) => <span className="text-xs">{row.original.emission}</span>,
    },
    {
      accessorKey: 'depotPartenaire',
      header: 'DÉPÔT PARTENAIRE',
      cell: ({ row }) => {
        const d = row.original.depotPartenaire;
        if (!d) return <span className="text-gray-400 text-xs">—</span>;
        return (
          <div className="flex flex-col gap-1">
            <span className="text-xs">{d.date}</span>
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
        return d ? <span className="text-xs">{d}</span> : <span className="text-gray-400 text-xs">—</span>;
      },
    },
    {
      accessorKey: 'agent',
      header: 'AGENT',
      cell: ({ row }) => <span className="text-xs">{row.original.agent}</span>,
    },
    {
      accessorKey: 'statut',
      header: 'STATUT',
      cell: ({ row }) => {
        const config = statutConfig[row.original.statut];
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${config.className}`}>
            • {config.label}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => {
        const { statut } = row.original;
        if (statut === 'Recouvrement') {
          return (
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 gap-1.5 whitespace-nowrap"
              onClick={() => onDepotPartenaire(row.original)}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Dépôt chez le Partner
            </Button>
          );
        }
        if (statut === 'Déposé partenaire') {
          return (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 gap-1.5 whitespace-nowrap"
              onClick={() => onEncaisser(row.original)}
            >
              <Banknote className="w-3.5 h-3.5" />
              Encaisser
            </Button>
          );
        }
        if (statut === 'Soldé') {
          return (
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 gap-1.5 whitespace-nowrap"
              onClick={() => onVerserComptable(row.original)}
            >
              <Landmark className="w-3.5 h-3.5" />
              Verser au comptable
            </Button>
          );
        }
        if (statut === 'Preuve ajoutée') {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Terminé
            </span>
          );
        }
        return <span className="text-gray-400 text-xs">—</span>;
      },
    },
  ];
}
