'use client';

import { Card } from '@heroui-v3/react';
import type { ReactNode } from 'react';

export interface PersonnelMobileCardField {
  label: string;
  value: ReactNode;
}

/**
 * Carte mobile générique du groupe Personnel TURBO — remplace les tableaux denses sur
 * petits écrans (cf. wrapper `hidden md:block` côté tableau / `md:hidden` côté cartes).
 * La donnée n'étant PAS une facture (employé, paie, déduction, absence…), on utilise
 * cette carte au lieu de FactureMobileCard.
 *
 * <h3>Ce qui change</h3>
 * <p>Le statut n'est plus un couple `(texte, classe CSS)` que la carte assemble en
 * pastille : c'est un nœud que l'appelant fournit — en pratique la pastille commune du
 * domaine. La carte ne peint plus de statut, elle le place.</p>
 */
export function PersonnelMobileCard({
  actions,
  fields,
  onClick,
  statut,
  subtitle,
  title,
}: {
  actions?: ReactNode;
  fields?: PersonnelMobileCardField[];
  onClick?: () => void;
  statut?: ReactNode;
  subtitle?: ReactNode;
  title: ReactNode;
}) {
  return (
    <Card
      className={onClick ? 'cursor-pointer active:bg-surface-secondary' : undefined}
      onClick={onClick}
    >
      <Card.Content className="gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{title}</p>
            {subtitle !== null && subtitle !== undefined && subtitle !== '' && (
              <p className="truncate text-xs text-muted">{subtitle}</p>
            )}
          </div>
          {statut !== null && statut !== undefined && statut !== '' && (
            <div className="shrink-0">{statut}</div>
          )}
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
          <div className="flex flex-col gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

/** Conteneur des cartes mobile : visible < md, masqué ≥ md (le tableau prend le relais). */
export function PersonnelMobileCardList({ children }: { children: ReactNode }) {
  return <div className="space-y-3 md:hidden">{children}</div>;
}
