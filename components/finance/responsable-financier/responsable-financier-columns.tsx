'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

// Statuts locaux alignés sur CDC v5
export type StatutFacture =
  | 'DRAFT'
  | 'À valider'
  | 'Validé'
  | 'Recouvrement'
  | 'En cours'
  | 'Déposé partenaire'
  | 'Preuve ajoutée'
  | `Acompte ${number}`
  | 'Soldé'
  | 'Versé au caissier'
  | 'En attente visa DGA'
  | 'Visé DGA'
  // SPEC-RECOUV-002 — orientation des fonds après visa.
  | 'Orienté banque'
  | 'Conservé en caisse'
  | 'Rejeté DGA'
  | 'Clôturé';

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

const statutConfig: Record<string, { label: string; className: string }> = {
  'DRAFT':                { label: 'À valider',             className: 'bg-gray-100 text-gray-600 border-gray-200' },
  'À valider':             { label: 'À valider',             className: 'bg-gray-100 text-gray-600 border-gray-200' },
  'Validé':                { label: 'Validé',                className: 'bg-blue-100 text-blue-700 border-blue-200' },
  'Recouvrement':          { label: 'Recouvrement',          className: 'bg-orange-100 text-orange-700 border-orange-200' },
  'En cours':              { label: 'En cours',              className: 'bg-orange-100 text-orange-700 border-orange-200' },
  'Déposé partenaire':     { label: 'Déposé partenaire',     className: 'bg-sky-100 text-sky-700 border-sky-200' },
  'Preuve ajoutée':        { label: 'Preuve ajoutée',        className: 'bg-purple-100 text-purple-700 border-purple-200' },
  'Soldé':                { label: 'Soldé',                className: 'bg-green-100 text-green-700 border-green-200' },
  'Versé au caissier':     { label: 'Versé au caissier',     className: 'bg-slate-100 text-slate-700 border-slate-200' },
  'En attente visa DGA':   { label: 'En attente visa DGA',   className: 'bg-violet-100 text-violet-700 border-violet-200' },
  'Visé DGA':              { label: 'Visé DGA',              className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'Orienté banque':        { label: 'Orienté banque',        className: 'bg-blue-100 text-blue-700 border-blue-200' },
  'Conservé en caisse':    { label: 'Conservé en caisse',    className: 'bg-amber-100 text-amber-700 border-amber-200' },
  'Rejeté DGA':            { label: 'Rejeté DGA',            className: 'bg-red-100 text-red-700 border-red-200' },
  'Clôturé':               { label: 'Clôturé',               className: 'bg-green-200 text-green-800 border-green-300' },
};

export function getStatutConfig(statut: string) {
  if (statut in statutConfig) return statutConfig[statut];
  if (statut.startsWith('Acompte')) return { label: statut, className: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  return { label: statut, className: 'bg-gray-100 text-gray-600 border-gray-200' };
}

export function formatMontant(v: number) {
  return new Intl.NumberFormat('fr-FR').format(v) + ' F CFA';
}

export function createResponsableFinancierColumns(
  onValider: (facture: IFactureRF) => void,
  onLancerRecouvrement: (facture: IFactureRF) => void,
  onDepotBanque: (facture: IFactureRF) => void,
  // 2026-05 (fix post-test mardi) — callback optionnel pour le bouton
  // "Confirmer réception fonds" (D3 du workflow facture). Affiché quand la
  // facture est en statut "Versé au caissier". Si la callback est non passée
  // (ex. test ou pages legacy), le bouton n'est pas rendu.
  onConfirmerReception?: (facture: IFactureRF) => void,
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
      const config = getStatutConfig(row.original.statut);
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
      const voirDetail = (
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-xs px-2" asChild>
          <Link href={`/finance/comptabilite/responsable-financier/${row.original.id}`}>
            Voir détail
          </Link>
        </Button>
      );

      if (statut === 'DRAFT' || statut === 'À valider') {
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-green-600 text-white hover:bg-green-700 text-xs px-3"
              onClick={() => onValider(row.original)}
            >
              ✓ Valider la facture
            </Button>
            {voirDetail}
          </div>
        );
      }
      if (statut === 'Validé') {
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-gray-900 text-white hover:bg-gray-700 text-xs px-3"
              onClick={() => onLancerRecouvrement(row.original)}
            >
              Lancer recouvrement →
            </Button>
            {voirDetail}
          </div>
        );
      }
      if (
        statut === 'Recouvrement' ||
        statut === 'En cours' ||
        statut === 'Déposé partenaire' ||
        statut === 'Preuve ajoutée' ||
        statut.startsWith('Acompte') ||
        statut === 'Soldé'
      ) {
        return (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-orange-600 italic">
              <Clock className="h-3 w-3" /> En cours de recouvrement...
            </span>
            {voirDetail}
          </div>
        );
      }
      if (statut === 'Versé au caissier') {
        return (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-slate-500 italic">
              <Clock className="h-3 w-3" /> Versé au caissier
            </span>
            {/* 2026-05 (fix post-test mardi) — Bouton D3 visible pour
                COMPTABLE + DGA + DG. La permission CASL "manage Finance"
                couvre les 3 rôles ; le backend re-valide qu'on est dans un
                statut compatible et renvoie 400 sinon. */}
            {onConfirmerReception && (
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs px-3"
                onClick={() => onConfirmerReception(row.original)}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmer réception fonds
              </Button>
            )}
            {voirDetail}
          </div>
        );
      }
      if (statut === 'En attente visa DGA') {
        return (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-violet-600 italic">
              <Clock className="h-3 w-3" /> En attente visa DGA...
            </span>
            {voirDetail}
          </div>
        );
      }
      if (statut === 'Orienté banque') {
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-green-600 text-white hover:bg-green-700 text-xs px-3"
              onClick={() => onDepotBanque(row.original)}
            >
              Dépôt en banque
            </Button>
            {voirDetail}
          </div>
        );
      }
      if (statut === 'Rejeté DGA') {
        return (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
              <AlertCircle className="h-3 w-3" /> Rejeté DGA
            </span>
            {voirDetail}
          </div>
        );
      }
      if (statut === 'Clôturé') {
        return (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
              <CheckCircle2 className="h-3 w-3" /> Clôturé
            </span>
            {voirDetail}
          </div>
        );
      }
      return voirDetail;
    },
  },
  ];
}
