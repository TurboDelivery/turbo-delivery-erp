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

function getStatutConfig(statut: string) {
  if (statut in statutConfig) return statutConfig[statut];
  // Acompte 1, Acompte 2…
  if (statut.startsWith('Acompte')) return { label: statut, className: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  return { label: statut, className: 'bg-gray-100 text-gray-600 border-gray-200' };
}

function formatMontant(v: number) {
  return new Intl.NumberFormat('fr-FR').format(v) + ' F CFA';
}

export function createAgentRecouvreurColumns(
  onDepotPartenaire: (facture: IFactureAgent) => void,
  onEncaisser: (facture: IFactureAgent) => void,
  onVerserCaissier: (facture: IFactureAgent) => void,
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
      cell: ({ row }) => {
        const { statut } = row.original;
        // Étape 3 : Dépôt chez le partenaire
        if (statut === 'Recouvrement') {
          return (
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 gap-1.5 whitespace-nowrap"
              onClick={() => onDepotPartenaire(row.original)}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Dépôt chez le partenaire
            </Button>
          );
        }
        // Étape 4 : Encaisser (acompte ou solde) — depuis Déposé partenaire
        //
        // Bug 2 fix (2026-05) — Cycle par acompte : sur "Déposé partenaire"
        // avec déjà du montant recouvré (cas après retour d'un cycle, mon
        // fix marquerDepotBanque renvoie à DEPOSE_PARTENAIRE quand pas
        // soldé+versé), on doit pouvoir EN MÊME TEMPS continuer à encaisser
        // ET verser ce qui est déjà encaissé. Avant ce fix : un seul bouton
        // selon montantRecouvre >= montant, ce qui bloquait le métier qui
        // veut "à chaque paiement, verser au caissier".
        if (statut === 'Déposé partenaire') {
          const { montantRecouvre, montant } = row.original;
          const hasRecouvrement = montantRecouvre !== null && montantRecouvre > 0;
          const isFullyCovered = hasRecouvrement && montant > 0 && (montantRecouvre as number) >= montant;
          if (isFullyCovered) {
            return (
              <Button
                size="sm"
                className="bg-slate-700 hover:bg-slate-800 text-white text-xs px-3 gap-1.5 whitespace-nowrap"
                onClick={() => onVerserCaissier(row.original)}
              >
                <Landmark className="w-3.5 h-3.5" />
                Verser au caissier
              </Button>
            );
          }
          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 gap-1.5 whitespace-nowrap"
                onClick={() => onEncaisser(row.original)}
              >
                <Banknote className="w-3.5 h-3.5" />
                Encaisser
              </Button>
              {/* Si déjà du montant recouvré (cycle d'acompte en cours), proposer
                  AUSSI le bouton "Verser au caissier" pour le solde déjà collecté. */}
              {hasRecouvrement && (
                <Button
                  size="sm"
                  className="bg-slate-700 hover:bg-slate-800 text-white text-xs px-3 gap-1.5 whitespace-nowrap"
                  onClick={() => onVerserCaissier(row.original)}
                >
                  <Landmark className="w-3.5 h-3.5" />
                  Verser au caissier
                </Button>
              )}
            </div>
          );
        }
        // Étape 4 bis : Ajouter un acompte supplémentaire (statut "Acompte N")
        //
        // Bug 2 fix (2026-05) — Quel que soit le pourcentage recouvré, le
        // recouvreur doit pouvoir verser au caissier ce qu'il a déjà en
        // main, et CONTINUER à encaisser des acomptes en parallèle. Avant :
        // tant que pas 100% recouvré, seul "Ajouter acompte" était dispo,
        // l'argent dormait dans la caisse du recouvreur.
        if (statut.startsWith('Acompte')) {
          const { montantRecouvre, montant } = row.original;
          const isFullyCovered = montantRecouvre !== null && montant > 0 && montantRecouvre >= montant;
          if (isFullyCovered) {
            return (
              <Button
                size="sm"
                className="bg-slate-700 hover:bg-slate-800 text-white text-xs px-3 gap-1.5 whitespace-nowrap"
                onClick={() => onVerserCaissier(row.original)}
              >
                <Landmark className="w-3.5 h-3.5" />
                Verser au caissier
              </Button>
            );
          }
          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 gap-1.5 whitespace-nowrap"
                onClick={() => onEncaisser(row.original)}
              >
                <Banknote className="w-3.5 h-3.5" />
                Ajouter acompte
              </Button>
              <Button
                size="sm"
                className="bg-slate-700 hover:bg-slate-800 text-white text-xs px-3 gap-1.5 whitespace-nowrap"
                onClick={() => onVerserCaissier(row.original)}
              >
                <Landmark className="w-3.5 h-3.5" />
                Verser au caissier
              </Button>
            </div>
          );
        }
        // Étape 5 : Verser les fonds au Caissier (depuis Soldé)
        if (statut === 'Soldé') {
          return (
            <Button
              size="sm"
              className="bg-slate-700 hover:bg-slate-800 text-white text-xs px-3 gap-1.5 whitespace-nowrap"
              onClick={() => onVerserCaissier(row.original)}
            >
              <Landmark className="w-3.5 h-3.5" />
              Verser au caissier
            </Button>
          );
        }
        // Bug encaissement bloqué (2026-05) — Sur les statuts de cycle
        // (Versé au caissier / En attente visa DGA / Visé DGA), l'agent doit
        // pouvoir continuer à encaisser de nouveaux acomptes du partner en
        // parallèle. Avant : lecture seule pure, l'agent était bloqué tant
        // que le cycle (caissier → DGA → banque) n'était pas terminé.
        //
        // Helper local : true si la facture n'est pas encore totalement
        // encaissée chez le partenaire (donc nouvel acompte possible).
        const { montantRecouvre, montant } = row.original;
        const peutEncaisserEncore =
          montantRecouvre === null || (montant > 0 && montantRecouvre < montant);

        if (statut === 'Versé au caissier') {
          return (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                En attente Caissier
              </span>
              {peutEncaisserEncore && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 gap-1.5 whitespace-nowrap"
                  onClick={() => onEncaisser(row.original)}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  Nouvel acompte
                </Button>
              )}
            </div>
          );
        }
        if (statut === 'En attente visa DGA') {
          return (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600">
                <Clock className="w-3.5 h-3.5" />
                En attente visa DGA
              </span>
              {peutEncaisserEncore && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 gap-1.5 whitespace-nowrap"
                  onClick={() => onEncaisser(row.original)}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  Nouvel acompte
                </Button>
              )}
            </div>
          );
        }
        if (statut === 'Visé DGA') {
          return (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Visé DGA
              </span>
              {peutEncaisserEncore && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 gap-1.5 whitespace-nowrap"
                  onClick={() => onEncaisser(row.original)}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  Nouvel acompte
                </Button>
              )}
            </div>
          );
        }
        if (statut === 'Rejeté DGA') {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
              <AlertCircle className="w-3.5 h-3.5" />
              Rejeté DGA
            </span>
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
        return <span className="text-gray-400 text-xs">—</span>;
      },
    },
  ];
}
