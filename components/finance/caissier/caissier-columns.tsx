'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Landmark } from 'lucide-react';
import { ChipStatutFacture } from '@/components/finance/common/chip-statut-facture';
import type { IFactureCaissier } from '@/features/caissier';
import { formatMontant } from '@/utils/format.utils';

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
        <span className="text-xs font-medium text-foreground">{row.original.partenaire}</span>
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
        if (!montantRecouvre) return <span className="text-muted text-xs">—</span>;
        return (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-foreground">{formatMontant(montantRecouvre)}</span>
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
      cell: ({ row }) => <span className="text-xs text-muted">{row.original.agent}</span>,
    },
    {
      accessorKey: 'statut',
      header: 'STATUT',
      cell: ({ row }) => <ChipStatutFacture statut={row.original.statut} />,
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
