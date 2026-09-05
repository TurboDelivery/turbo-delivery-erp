'use client';

import { Avatar, Card, Chip } from '@heroui-v3/react';
import type { ReactNode } from 'react';

export interface LivreurMobileField {
  label: string;
  value: ReactNode;
}

/*
 * `primary` et `secondary` ne sont plus des COULEURS de pastille en v3 : ils y disent une
 * intensite, pas un sens. Ce qui reste est une echelle semantique.
 */
type ChipColor = 'danger' | 'default' | 'success' | 'warning';

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
    <Card
      className={onClick ? 'cursor-pointer active:bg-surface-secondary' : undefined}
      onClick={onClick}
    >
      <Card.Content className="gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            {avatarUrl !== undefined && (
              <Avatar className="shrink-0" size="sm">
                <Avatar.Image alt="" src={avatarUrl ?? undefined} />
                <Avatar.Fallback>{(nom ?? '?').slice(0, 2).toUpperCase()}</Avatar.Fallback>
              </Avatar>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{nom}</p>
              {sousTitre ? <div className="text-xs text-muted">{sousTitre}</div> : null}
            </div>
          </div>
          {statut !== undefined && statut !== null && statut !== '' ? (
            <Chip className="shrink-0" color={statutColor} size="sm" variant="soft">
              <Chip.Label>{statut}</Chip.Label>
            </Chip>
          ) : null}
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
          <div className="flex flex-wrap gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

/** Conteneur des cartes mobile : visible < md, masqué ≥ md (le tableau prend le relais). */
export function LivreurMobileCardList({ children }: { children: ReactNode }) {
  return <div className="md:hidden space-y-3">{children}</div>;
}
