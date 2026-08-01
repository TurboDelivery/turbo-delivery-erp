'use client';

import { Clock } from 'lucide-react';

import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { createUrlFile, getInitials } from '@/utils/createUrlFile';

import type { LigneFileVue } from '../hooks/use-file-attente-vue';
import { attenteLisible, heureLisible } from '../utils/file-attente.utils';

function Photo({ ligne }: { ligne: LigneFileVue }) {
  const url = ligne.avatar ? createUrlFile(ligne.avatar, 'backend') : '';
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={ligne.nomComplet}
        className="h-9 w-9 shrink-0 rounded-full object-cover"
      />
    );
  }
  // Initiales en gris neutre, et non en couleur tirée du nom : sur cet écran le
  // vert veut dire « prochaine course ». Des pastilles vertes distribuées au
  // hasard des initiales brouilleraient le seul signal de couleur qui compte.
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-default-200 text-xs font-semibold text-default-600">
      {getInitials(ligne.nomComplet)}
    </span>
  );
}

/**
 * Une place dans la file.
 *
 * <p>Le premier rang est traité différemment du reste : ce n'est pas une
 * décoration, c'est l'information opérationnelle de la ligne — c'est lui qui
 * recevra la prochaine course de ce partenaire.</p>
 */
export function FileLivreurLigne({
  ligne,
  maintenant,
}: {
  ligne: LigneFileVue;
  maintenant: number;
}) {
  const premier = ligne.rang === 1;
  const type = ligne.typeContrat ? getTurboyTypeDisplay(ligne.typeContrat) : null;

  return (
    <li
      className={`flex items-center gap-3 rounded-xl px-2.5 py-2 ${
        premier
          ? 'bg-[#1AA05A]/[0.08] ring-1 ring-inset ring-[#1AA05A]/25'
          : 'hover:bg-default-50 dark:hover:bg-default-100/40'
      }`}
    >
      <span
        className={`flex h-8 shrink-0 items-center justify-center rounded-[10px] px-2 text-[13px] font-bold tabular-nums ${
          premier ? 'bg-[#1AA05A] text-white' : 'bg-default-100 text-default-500'
        }`}
        aria-label={`Rang ${ligne.rang}`}
      >
        N°{ligne.rang}
      </span>

      <Photo ligne={ligne} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-default-800">{ligne.nomComplet}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {premier && (
            <span className="rounded-full bg-[#1AA05A]/[0.12] px-2 py-[1px] text-[10px] font-bold uppercase tracking-wide text-[#1AA05A]">
              Prochaine course
            </span>
          )}
          {/* Type de contrat : affiché seulement s'il est connu. Écrire
              « À catégoriser » parce que l'annuaire n'a pas répondu ferait
              passer une panne de lecture pour un défaut de dossier RH. */}
          {type && (
            <span className="rounded-full bg-default-100 px-2 py-[1px] text-[10px] font-semibold text-default-600">
              {type.label}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="flex items-center justify-end gap-1 text-xs font-semibold tabular-nums text-default-700">
          <Clock size={12} className="text-default-400" />
          {attenteLisible(ligne.entreeLe, maintenant)}
        </p>
        <p className="text-[11px] text-default-400">entré à {heureLisible(ligne.entreeLe)}</p>
      </div>
    </li>
  );
}
