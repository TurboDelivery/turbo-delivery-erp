'use client';

import type { ReactNode } from 'react';
import { Avatar, Chip } from '@/components/heroui';

export interface LivreurMobileField {
  label: string;
  value: ReactNode;
}

type ChipColor = 'success' | 'warning' | 'secondary' | 'primary' | 'danger' | 'default';

/**
 * Carte mobile générique pour les lignes « livreur / turboy » (groupe
 * Turboys / Livreurs / Créneaux). Remplace le tableau dense sur petit écran
 * (cf. wrappers `hidden md:block` / `md:hidden`). Le chip de statut et les
 * actions sont passés par la vue appelante pour réutiliser exactement la même
 * logique que le tableau.
 *
 * Volontairement distinct de FactureMobileCard (montant FCFA en rouge, numéro
 * de facture) : ici la donnée est un livreur (avatar, nom, téléphone, statut
 * via Chip HeroUI).
 */
export function LivreurMobileCard({
  nom,
  sousTitre,
  avatarUrl,
  statut,
  statutColor = 'default',
  fields,
  actions,
  onClick,
}: {
  nom: string;
  sousTitre?: ReactNode;
  avatarUrl?: string | null;
  statut?: ReactNode;
  statutColor?: ChipColor;
  fields?: LivreurMobileField[];
  actions?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      className={`bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2 ${onClick ? 'cursor-pointer active:bg-gray-50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {avatarUrl !== undefined && (
            <Avatar isBordered name={nom} size="sm" src={avatarUrl ?? undefined} className="shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{nom}</p>
            {sousTitre ? <div className="text-xs text-gray-500">{sousTitre}</div> : null}
          </div>
        </div>
        {statut !== undefined && statut !== null && statut !== '' ? (
          <Chip color={statutColor} size="sm" variant="flat" className="shrink-0">
            {statut}
          </Chip>
        ) : null}
      </div>

      {fields?.filter((f) => f.value !== null && f.value !== undefined && f.value !== '').map((f, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400 shrink-0">{f.label}</span>
          <span className="text-sm text-gray-700 text-right truncate">{f.value}</span>
        </div>
      ))}

      {actions && (
        <div className="pt-2 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
}

/** Conteneur des cartes mobile : visible < md, masqué ≥ md (le tableau prend le relais). */
export function LivreurMobileCardList({ children }: { children: ReactNode }) {
  return <div className="md:hidden space-y-3">{children}</div>;
}
