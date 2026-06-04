'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Banknote, ClipboardList, Landmark, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { IAgentFacture as IFactureAgent } from '@/features/agent-recouvreur';

// Statuts fixes — les statuts "Acompte N" sont traités dynamiquement via startsWith
const statutConfig: Record<string, { label: string; className: string }> = {
  'Recouvrement':         { label: 'Recouvrement',         className: 'bg-orange-100 text-orange-700 border-orange-200' },
  'Déposé partenaire':    { label: 'Déposé partenaire',    className: 'bg-blue-100 text-blue-700 border-blue-200' },
  'Soldé':               { label: 'Soldé',               className: 'bg-green-100 text-green-700 border-green-200' },
  'Versé au caissier':    { label: 'Versé au caissier',    className: 'bg-slate-100 text-slate-700 border-slate-200' },
  'En attente visa DGA':  { label: 'En attente visa DGA',  className: 'bg-violet-100 text-violet-700 border-violet-200' },
  'Visé DGA':             { label: 'Visé DGA',             className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'Rejeté DGA':           { label: 'Rejeté DGA',           className: 'bg-red-100 text-red-700 border-red-200' },
  'Clôturé':              { label: 'Clôturé',              className: 'bg-green-200 text-green-800 border-green-300' },
};

export function getStatutConfig(statut: string) {
  if (statut in statutConfig) return statutConfig[statut];
  // Acompte 1, Acompte 2…
  if (statut.startsWith('Acompte')) return { label: statut, className: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  return { label: statut, className: 'bg-gray-100 text-gray-600 border-gray-200' };
}

export function formatMontant(v: number) {
  return new Intl.NumberFormat('fr-FR').format(v) + ' F CFA';
}

/**
 * Rendu des actions agent recouvreur selon le statut + le montant recouvré.
 * Extrait pour être PARTAGÉ entre la colonne du tableau (desktop) et les cartes
 * mobile (cf. agent-recouvreur-view) → logique conditionnelle unique, pas de
 * divergence. Reçoit la facture (row.original) et les 3 handlers.
 */
export function renderAgentActions(
  facture: IFactureAgent,
  onDepotPartenaire: (f: IFactureAgent) => void,
  onEncaisser: (f: IFactureAgent) => void,
  onVerserCaissier: (f: IFactureAgent) => void,
) {
  const { statut } = facture;
  if (statut === 'Recouvrement') {
    return (
      <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 gap-1.5 whitespace-nowrap" onClick={() => onDepotPartenaire(facture)}>
        <ClipboardList className="w-3.5 h-3.5" />
        Dépôt chez le partenaire
      </Button>
    );
  }
  if (statut === 'Déposé partenaire') {
    const { montantRecouvre, montant } = facture;
    const hasRecouvrement = montantRecouvre !== null && montantRecouvre > 0;
    const isFullyCovered = hasRecouvrement && montant > 0 && (montantRecouvre as number) >= montant;
    if (isFullyCovered) {
      return (
        <Button size="sm" className="bg-slate-700 hover:bg-slate-800 text-white text-xs px-3 gap-1.5 whitespace-nowrap" onClick={() => onVerserCaissier(facture)}>
          <Landmark className="w-3.5 h-3.5" />
          Verser au caissier
        </Button>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 gap-1.5 whitespace-nowrap" onClick={() => onEncaisser(facture)}>
          <Banknote className="w-3.5 h-3.5" />
          Encaisser
        </Button>
        {hasRecouvrement && (
          <Button size="sm" className="bg-slate-700 hover:bg-slate-800 text-white text-xs px-3 gap-1.5 whitespace-nowrap" onClick={() => onVerserCaissier(facture)}>
            <Landmark className="w-3.5 h-3.5" />
            Verser au caissier
          </Button>
        )}
      </div>
    );
  }
  if (statut.startsWith('Acompte')) {
    const { montantRecouvre, montant } = facture;
    const isFullyCovered = montantRecouvre !== null && montant > 0 && montantRecouvre >= montant;
    if (isFullyCovered) {
      return (
        <Button size="sm" className="bg-slate-700 hover:bg-slate-800 text-white text-xs px-3 gap-1.5 whitespace-nowrap" onClick={() => onVerserCaissier(facture)}>
          <Landmark className="w-3.5 h-3.5" />
          Verser au caissier
        </Button>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 gap-1.5 whitespace-nowrap" onClick={() => onEncaisser(facture)}>
          <Banknote className="w-3.5 h-3.5" />
          Ajouter acompte
        </Button>
        <Button size="sm" className="bg-slate-700 hover:bg-slate-800 text-white text-xs px-3 gap-1.5 whitespace-nowrap" onClick={() => onVerserCaissier(facture)}>
          <Landmark className="w-3.5 h-3.5" />
          Verser au caissier
        </Button>
      </div>
    );
  }
  if (statut === 'Soldé') {
    return (
      <Button size="sm" className="bg-slate-700 hover:bg-slate-800 text-white text-xs px-3 gap-1.5 whitespace-nowrap" onClick={() => onVerserCaissier(facture)}>
        <Landmark className="w-3.5 h-3.5" />
        Verser au caissier
      </Button>
    );
  }
  const { montantRecouvre, montant } = facture;
  const peutEncaisserEncore = montantRecouvre === null || (montant > 0 && montantRecouvre < montant);
  if (statut === 'Versé au caissier') {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Clock className="w-3.5 h-3.5" /> En attente Caissier
        </span>
        {peutEncaisserEncore && (
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 gap-1.5 whitespace-nowrap" onClick={() => onEncaisser(facture)}>
            <Banknote className="w-3.5 h-3.5" /> Nouvel acompte
          </Button>
        )}
      </div>
    );
  }
  if (statut === 'En attente visa DGA') {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600">
          <Clock className="w-3.5 h-3.5" /> En attente visa DGA
        </span>
        {peutEncaisserEncore && (
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 gap-1.5 whitespace-nowrap" onClick={() => onEncaisser(facture)}>
            <Banknote className="w-3.5 h-3.5" /> Nouvel acompte
          </Button>
        )}
      </div>
    );
  }
  if (statut === 'Visé DGA') {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <CheckCircle2 className="w-3.5 h-3.5" /> Visé DGA
        </span>
        {peutEncaisserEncore && (
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 gap-1.5 whitespace-nowrap" onClick={() => onEncaisser(facture)}>
            <Banknote className="w-3.5 h-3.5" /> Nouvel acompte
          </Button>
        )}
      </div>
    );
  }
  if (statut === 'Rejeté DGA') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
        <AlertCircle className="w-3.5 h-3.5" /> Rejeté DGA
      </span>
    );
  }
  if (statut === 'Clôturé') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
        <CheckCircle2 className="w-3.5 h-3.5" /> Clôturé
      </span>
    );
  }
  return <span className="text-gray-400 text-xs">—</span>;
}

export function createAgentRecouvreurColumns(
  onDepotPartenaire: (facture: IFactureAgent) => void,
  onEncaisser: (facture: IFactureAgent) => void,
  onVerserCaissier: (facture: IFactureAgent) => void,
  // Ajoute une colonne de cases à cocher en tête (encaissement en masse). La
  // sélectivité ligne par ligne est portée par `enableRowSelection` côté table.
  withSelection = false,
): ColumnDef<IFactureAgent>[] {
  const selectionColumn: ColumnDef<IFactureAgent> = {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        aria-label="Tout sélectionner"
        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer accent-green-600"
        checked={table.getIsAllPageRowsSelected()}
        ref={(el) => {
          if (el) el.indeterminate = table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected();
        }}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) =>
      row.getCanSelect() ? (
        <input
          type="checkbox"
          aria-label="Sélectionner la facture"
          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer accent-green-600"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ) : null,
    enableSorting: false,
  };

  const columns: ColumnDef<IFactureAgent>[] = [
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
      accessorKey: 'statut',
      header: 'STATUT',
      cell: ({ row }) => {
        const config = getStatutConfig(row.original.statut);
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
      cell: ({ row }) => renderAgentActions(row.original, onDepotPartenaire, onEncaisser, onVerserCaissier),
    },
  ];

  return withSelection ? [selectionColumn, ...columns] : columns;
}
