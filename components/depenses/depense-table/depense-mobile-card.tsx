'use client';

import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { IDepense } from '@/features/depenses/types/depense.type';
import { DepenseActions, formatTypeDepense } from './depense-columns';

/**
 * Carte mobile d'une dépense (cf. DepenseTable, wrapper `hidden md:block` /
 * `md:hidden`). Réutilise le badge de type et le menu d'actions partagés de
 * `depense-columns` pour rester aligné sur le tableau desktop.
 */
export function DepenseMobileCard({ depense }: { depense: IDepense }) {
  const typeInfo = formatTypeDepense(depense.typeDepense);
  const dateAjout = format(new Date(depense.dateDepense), 'dd/MM/yyyy');

  return (
    <div className="bg-surface dark:bg-transparent border border-separator rounded-xl p-4 shadow-xs space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground min-w-0 wrap-break-word">
          {depense.description || depense.categorie?.nomCategorie || 'Dépense'}
        </p>
        <Badge variant={typeInfo.variant} className="shrink-0">
          {typeInfo.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted">Catégorie</span>
        <span className="text-sm text-foreground text-right wrap-break-word">{depense.categorie?.nomCategorie ?? '-'}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted">Date d&apos;ajout</span>
        <span className="text-sm text-foreground">{dateAjout}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted">Comptabilisation</span>
        <span className="text-sm text-foreground">{dateAjout}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted">Montant</span>
        <span className="text-sm font-semibold text-foreground">
          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(depense.montant)}
        </span>
      </div>

      <div className="pt-1 flex justify-end">
        <DepenseActions depense={depense} />
      </div>
    </div>
  );
}
