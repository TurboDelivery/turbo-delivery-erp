'use client';

import type { ReactNode } from 'react';

export interface MobileCardField {
  label: string;
  value: ReactNode;
}

/**
 * Carte facture mobile — affichage tactile adapté aux petits écrans, en
 * remplacement du tableau dense (cf. wrapper `hidden md:block` / `md:hidden`).
 * Utilisée par les pages Comptabilité (caissier, responsable financier, agent
 * recouvreur) qui partagent la même forme de ligne (numéro, partenaire,
 * montant, statut, actions). Le chip de statut et les boutons d'action sont
 * passés par la page appelante pour réutiliser exactement sa logique.
 */
export function FactureMobileCard({
  numero,
  partenaire,
  montant,
  statut,
  statutClassName,
  fields,
  actions,
  onClick,
}: {
  numero: string;
  partenaire: string;
  montant: string; // déjà formaté
  statut: string;
  statutClassName?: string;
  fields?: MobileCardField[];
  actions?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      className={`bg-white border border-gray-100 rounded-xl p-4 shadow-xs space-y-3 ${onClick ? 'cursor-pointer active:bg-gray-50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{partenaire}</p>
          <p className="text-xs text-red-500 font-medium">{numero}</p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${statutClassName ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
        >
          {statut}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Montant</span>
        <span className="text-sm font-bold text-red-500">{montant}</span>
      </div>

      {fields?.filter((f) => f.value !== null && f.value !== undefined && f.value !== '').map((f, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400 shrink-0">{f.label}</span>
          <span className="text-sm text-gray-700 text-right truncate">{f.value}</span>
        </div>
      ))}

      {actions && (
        <div className="pt-1 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
}

/** Conteneur des cartes mobile : visible < md, masqué ≥ md (le tableau prend le relais). */
export function MobileCardList({ children }: { children: ReactNode }) {
  return <div className="md:hidden space-y-3">{children}</div>;
}
