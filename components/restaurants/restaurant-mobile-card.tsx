'use client';

import { Avatar, Card } from '@heroui-v3/react';
import { BadgeCheck, Diamond } from 'lucide-react';
import type { ReactNode } from 'react';

import { PastilleNom } from './table/restaurant-table-columns';

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
 * `PastilleNom`). Le chip de statut et les actions sont fournis par la page
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
    <Card
      className={onClick ? 'cursor-pointer active:bg-surface-secondary' : undefined}
      onClick={onClick}
    >
      <Card.Content className="gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            {/* La pastille de repli etait peinte parmi dix couleurs Tailwind brutes,
                choisies par le code de la premiere lettre, avec du texte BLANC sur les dix
                — y compris sur le jaune, ou l'initiale etait illisible. */}
            <Avatar className="size-9 shrink-0">
              {logoUrl && <Avatar.Image alt={nom} src={logoUrl} />}
              <Avatar.Fallback>{nom?.[0]?.toUpperCase() ?? '?'}</Avatar.Fallback>
            </Avatar>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground capitalize">
                <span className="truncate">{nom}</span>
                {verified && (
                  <BadgeCheck aria-hidden="true" className="size-4 shrink-0 text-success" />
                )}
                {gratuite && (
                  <Diamond aria-hidden="true" className="size-3.5 shrink-0 text-muted" />
                )}
              </p>
            </div>
          </div>
          {statut && <div className="shrink-0">{statut}</div>}
        </div>

        {fields
          ?.filter((f) => f.value !== null && f.value !== undefined && f.value !== '')
          .map((f, i) => (
            <div className="flex items-center justify-between gap-3" key={i}>
              <span className="shrink-0 text-xs text-muted">{f.label}</span>
              <span className="truncate text-right text-sm text-foreground">{f.value}</span>
            </div>
          ))}

        {actions && (
          <div
            className="flex flex-wrap items-center gap-2 pt-1"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

/** Conteneur des cartes mobile : visible < md, masqué ≥ md (le tableau prend le relais). */
export function RestaurantMobileCardList({ children }: { children: ReactNode }) {
  return <div className="md:hidden space-y-3">{children}</div>;
}
