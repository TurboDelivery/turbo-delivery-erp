'use client';

import type { ReactNode } from 'react';

export interface PersonnelMobileCardField {
  label: string;
  value: ReactNode;
}

/**
 * Carte mobile générique du groupe Personnel TURBO — remplace les tableaux
 * denses sur petits écrans (cf. wrapper `hidden md:block` côté tableau /
 * `md:hidden` côté cartes). La donnée n'étant PAS une facture (employé, paie,
 * déduction, absence…), on utilise cette carte au lieu de FactureMobileCard.
 *
 * Le chip de statut et les boutons d'action sont fournis par la vue appelante
 * pour réutiliser exactement la même logique (handlers/mutations) que le tableau.
 */
export function PersonnelMobileCard({
  title,
  subtitle,
  statut,
  statutClassName,
  fields,
  actions,
  onClick,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  statut?: ReactNode;
  statutClassName?: string;
  fields?: PersonnelMobileCardField[];
  actions?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      className={`bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2 ${onClick ? 'cursor-pointer active:bg-gray-50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
          {subtitle !== null && subtitle !== undefined && subtitle !== '' && (
            <p className="text-xs text-gray-500 truncate">{subtitle}</p>
          )}
        </div>
        {statut !== null && statut !== undefined && statut !== '' && (
          <span
            className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${statutClassName ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
          >
            {statut}
          </span>
        )}
      </div>

      {fields?.filter((f) => f.value !== null && f.value !== undefined && f.value !== '').map((f, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400 shrink-0">{f.label}</span>
          <span className="text-sm text-gray-700 text-right truncate">{f.value}</span>
        </div>
      ))}

      {actions && (
        <div className="pt-2 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
}

/** Conteneur des cartes mobile : visible < md, masqué ≥ md (le tableau prend le relais). */
export function PersonnelMobileCardList({ children }: { children: ReactNode }) {
  return <div className="md:hidden space-y-3">{children}</div>;
}
