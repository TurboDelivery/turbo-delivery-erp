'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Landmark } from 'lucide-react';
import type { IFactureCaissier } from '@/features/caissier';

const statutConfig: Record<string, { label: string; className: string }> = {
  'Versé au caissier':    { label: 'Versé au caissier',    className: 'bg-amber-100 text-amber-700 border-amber-200' },
  'En attente visa DGA': { label: 'En attente visa DGA', className: 'bg-violet-100 text-violet-700 border-violet-200' },
  'Rejeté DGA':          { label: 'Rejeté DGA',          className: 'bg-red-100 text-red-700 border-red-200' },
  'Visé DGA':             { label: 'Visé DGA',             className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'Orienté banque':       { label: 'Orienté banque',       className: 'bg-blue-100 text-blue-700 border-blue-200' },
  'Conservé en caisse':   { label: 'Conservé en caisse',   className: 'bg-amber-100 text-amber-700 border-amber-200' },
  'Clôturé':             { label: 'Clôturé',             className: 'bg-green-100 text-green-800 border-green-300' },
};

function formatMontant(v: number) {
  return new Intl.NumberFormat('fr-FR').format(v) + ' F CFA';
}

export function createCaissierColumns(
  onConfirmer: (facture: IFactureCaissier) => void,
  onDepotBanque: (facture: IFactureCaissier) => void,
): ColumnDef<IFactureCaissier>[] {
  return [
    {
      accessorKey: 'numero',
      header: 'N° FACTURE',
      cell: ({ row }) => (
        <span className="font-medium text-red-500 text-xs whitespace-nowrap">{row.original.numero}</span>
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
            <span className="text-xs font-semibold text-gray-800">{formatMontant(montantRecouvre)}</span>
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
      accessorKey: 'agent',
      header: 'AGENT',
      cell: ({ row }) => <span className="text-xs text-gray-600">{row.original.agent}</span>,
    },
    {
      accessorKey: 'statut',
      header: 'STATUT',
      cell: ({ row }) => {
        const config = statutConfig[row.original.statut] ?? {
          label: row.original.statut,
          className: 'bg-gray-100 text-gray-600 border-gray-200',
        };
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

        if (statut === 'Versé au caissier' || statut === 'Rejeté DGA') {
          return (
            <Button
              size="sm"
              className={`text-white text-xs px-3 gap-1.5 whitespace-nowrap ${
                statut === 'Rejeté DGA'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
              onClick={() => onConfirmer(row.original)}
            >
              <Landmark className="w-3.5 h-3.5" />
              {statut === 'Rejeté DGA' ? 'Re-soumettre fiche de paiement' : 'Enregistrer fiche de paiement'}
            </Button>
          );
        }
        if (statut === 'En attente visa DGA') {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              En attente DGA
            </span>
          );
        }
        // SPEC-RECOUV-002 — après visa, la Direction doit orienter les fonds.
        // Le dépôt n'est activable QUE sur « Orienté banque ».
        if (statut === 'Visé DGA') {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              En attente orientation DG
            </span>
          );
        }
        if (statut === 'Conservé en caisse') {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Conservé en caisse
            </span>
          );
        }
        if (statut === 'Orienté banque') {
          return (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 gap-1.5 whitespace-nowrap"
              onClick={() => onDepotBanque(row.original)}
            >
              <Landmark className="w-3.5 h-3.5" />
              Dépôt en banque
            </Button>
          );
        }
        if (statut === 'Clôturé') {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Clôturé
            </span>
          );
        }
        return null;
      },
    },
  ];
}
