'use client';

import React, { Key, ReactNode } from 'react';

export interface BonLivraisonColumn {
  name: string;
  uid: string;
}

/**
 * Carte mobile générique pour les tableaux de bons de livraison
 * (pages "Les tickets", "Commandes terminées", "Commandes En Attentes").
 *
 * Réutilise EXACTEMENT le `renderCell(item, columnKey)` de la page : aucune
 * divergence avec le tableau desktop. La carte met en avant la référence (titre)
 * et le statut (chip en haut à droite) puis liste les autres colonnes en
 * paires label/valeur. Affichage tactile en remplacement du tableau dense < md.
 */
export function BonLivraisonMobileCard<T>({
  item,
  columns,
  renderCell,
  referenceKey = 'reference',
  statutKey = 'statut',
  actions,
}: {
  item: T;
  columns: BonLivraisonColumn[];
  // Le renderCell des pages peut retourner un type plus large que ReactNode
  // (certaines cellules renvoient un objet de date) ; on l'accepte tel quel et
  // on caste le rendu en ReactNode, comme le fait le tableau desktop (as React.ReactNode).
  renderCell: (item: T, columnKey: Key) => unknown;
  referenceKey?: string;
  statutKey?: string;
  actions?: ReactNode;
}) {
  const reference = columns.find((c) => c.uid === referenceKey);
  const statut = columns.find((c) => c.uid === statutKey);
  const others = columns.filter((c) => c.uid !== referenceKey && c.uid !== statutKey);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {reference && <p className="text-xs text-gray-400">{reference.name}</p>}
          <p className="text-sm font-semibold text-red-500 truncate">
            {reference ? (renderCell(item, reference.uid) as ReactNode) : null}
          </p>
        </div>
        {statut && <div className="shrink-0">{renderCell(item, statut.uid) as ReactNode}</div>}
      </div>

      {others.map((col) => (
        <div key={col.uid} className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400 shrink-0">{col.name}</span>
          <span className="text-sm text-gray-700 text-right truncate">{renderCell(item, col.uid) as ReactNode}</span>
        </div>
      ))}

      {actions && <div className="pt-1 flex flex-col gap-2">{actions}</div>}
    </div>
  );
}

/** Conteneur des cartes mobile : visible < md, masqué ≥ md (le tableau prend le relais). */
export function BonLivraisonMobileList({ children }: { children: ReactNode }) {
  return <div className="md:hidden space-y-3">{children}</div>;
}
