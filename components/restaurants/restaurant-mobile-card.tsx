'use client';

import type { ReactNode } from 'react';
import { Avatar } from '@/components/heroui';
import { BadgeCheck, Diamond } from 'lucide-react';
import { getAvatarColor } from './table/restaurant-table-columns';

export interface RestaurantMobileCardField {
  label: string;
  value: ReactNode;
}

/**
 * Carte partenaire/restaurant mobile — remplace le tableau dense en dessous de
 * `md` (cf. wrapper `hidden md:block` côté tableau / `md:hidden` côté cartes).
 * Réutilisée par toutes les pages du groupe Partenaires (liste, partiellement
 * validés, nouveaux). L'avatar accepte une URL de logo, sinon retombe sur une
 * pastille colorée avec l'initiale (même logique que la colonne du tableau via
 * `getAvatarColor`). Le chip de statut et les actions sont fournis par la page
 * appelante pour réutiliser exactement sa logique — zéro divergence.
 */
export function RestaurantMobileCard({
  nom,
  logoUrl,
  verified,
  gratuite,
  statut,
  fields,
  actions,
  onClick,
}: {
  nom: string;
  logoUrl?: string;
  /** Affiche le badge "vérifié" (bleu) à côté du nom. */
  verified?: boolean;
  /** Affiche le badge "commission gratuite" (losange ambre) à côté du nom. */
  gratuite?: boolean;
  /** Chip de statut rendu par l'appelant (réutilise StatusChip / Chip). */
  statut?: ReactNode;
  fields?: RestaurantMobileCardField[];
  actions?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      className={`bg-surface border border-separator rounded-xl p-4 shadow-xs space-y-3 ${onClick ? 'cursor-pointer active:bg-surface-secondary' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {logoUrl ? (
            <Avatar src={logoUrl} size="sm" className="shrink-0" />
          ) : (
            <div className={`w-9 h-9 rounded-full ${getAvatarColor(nom)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
              {nom?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground capitalize truncate flex items-center gap-1.5">
              <span className="truncate">{nom}</span>
              {verified && <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />}
              {gratuite && <Diamond className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            </p>
          </div>
        </div>
        {statut && <div className="shrink-0">{statut}</div>}
      </div>

      {fields?.filter((f) => f.value !== null && f.value !== undefined && f.value !== '').map((f, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted shrink-0">{f.label}</span>
          <span className="text-sm text-foreground text-right truncate">{f.value}</span>
        </div>
      ))}

      {actions && (
        <div className="pt-1 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
}

/** Conteneur des cartes mobile : visible < md, masqué ≥ md (le tableau prend le relais). */
export function RestaurantMobileCardList({ children }: { children: ReactNode }) {
  return <div className="md:hidden space-y-3">{children}</div>;
}
