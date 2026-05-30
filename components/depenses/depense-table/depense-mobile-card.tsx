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
    <div className="bg-white dark:bg-transparent border border-gray-100 dark:border-gray-700 rounded-xl p-4 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 min-w-0 break-words">
          {depense.description || depense.categorie?.nomCategorie || 'Dépense'}
        </p>
        <Badge variant={typeInfo.variant} className="shrink-0">
          {typeInfo.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-400">Catégorie</span>
        <span className="text-sm text-gray-700 dark:text-gray-300 text-right break-words">{depense.categorie?.nomCategorie ?? '-'}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-400">Date d&apos;ajout</span>
        <span className="text-sm text-gray-700 dark:text-gray-300">{dateAjout}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-400">Comptabilisation</span>
        <span className="text-sm text-gray-700 dark:text-gray-300">{dateAjout}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-400">Montant</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(depense.montant)}
        </span>
      </div>

      <div className="pt-1 flex justify-end">
        <DepenseActions depense={depense} />
      </div>
    </div>
  );
}
