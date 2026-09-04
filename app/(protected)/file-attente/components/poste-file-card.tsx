'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Store, Users } from 'lucide-react';

import type { PosteFileVue } from '../hooks/use-file-attente-vue';
import { pluriel } from '../utils/file-attente.utils';
import { FileLivreurLigne } from './file-livreur-ligne';

/** Au-delà, la carte devient une liste à dérouler plutôt qu'un mur de noms. */
const RANGS_VISIBLES = 6;

/**
 * La file d'un poste, dans l'ordre où les courses y seront distribuées.
 *
 * <p>Deux états seulement, et ils se lisent au premier coup d'œil : le poste
 * tourne, ou il est déserté. Le second n'est pas un vide à combler
 * visuellement — c'est une alerte : aucune commande de ce partenaire ne peut
 * être servie tant que personne n'a pointé sa montée.</p>
 */
export function PosteFileCard({ poste, maintenant }: { poste: PosteFileVue; maintenant: number }) {
  const [tousAffiches, setTousAffiches] = useState(false);

  const visibles = tousAffiches ? poste.file : poste.file.slice(0, RANGS_VISIBLES);
  const restants = poste.file.length - visibles.length;
  const deroulable = poste.file.length > RANGS_VISIBLES;

  const pastille = poste.desert ? 'bg-danger/10 text-danger-soft-foreground' : 'bg-success/10 text-success-soft-foreground';
  const etat = poste.desert
    ? 'bg-danger/12 text-danger-soft-foreground'
    : 'bg-success/12 text-success-soft-foreground';

  return (
    <article className="flex flex-col rounded-2xl border border-default-200/50 bg-surface p-4 dark:bg-content1">
      <header className="flex items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${pastille}`}>
          <Store className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-default-800" title={poste.restaurant}>
            {poste.restaurant}
          </h3>
          <p className="mt-0.5 flex items-start gap-1 text-[11px] leading-snug text-default-400">
            <Users className="mt-[2px] h-3 w-3 shrink-0" />
            {poste.livreursAssignes} {pluriel(poste.livreursAssignes, 'livreur')}{' '}
            {pluriel(poste.livreursAssignes, 'assigné')} à ce poste
          </p>
        </div>

        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${etat}`}>
          {poste.desert ? 'Personne en file' : `${poste.file.length} en file`}
        </span>
      </header>

      {poste.desert ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-dashed border-danger/35 bg-danger/5 p-3">
          <AlertTriangle className="mt-px h-4 w-4 shrink-0 text-danger-soft-foreground" />
          <p className="text-xs leading-relaxed text-default-600">
            Personne n&apos;attend sur ce poste : aucun livreur n&apos;a pointé sa montée, ou tous
            se sont mis en pause ou ont pointé leur fin de service.{' '}
            <span className="font-semibold text-default-700">
              Aucune commande de ce partenaire ne peut être servie.
            </span>
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-3 flex flex-col gap-1">
            {visibles.map((ligne) => (
              <FileLivreurLigne key={ligne.cle} ligne={ligne} maintenant={maintenant} />
            ))}
          </ul>

          {deroulable && (
            <button
              type="button"
              onClick={() => setTousAffiches((affiche) => !affiche)}
              className="mt-2 flex items-center justify-center gap-1 rounded-xl bg-default-100 py-1.5 text-xs font-semibold text-default-600 transition hover:bg-default-200"
            >
              {tousAffiches ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Réduire la file
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Afficher {restants} {pluriel(restants, 'livreur')} de plus
                </>
              )}
            </button>
          )}

          <p className="mt-2 text-[11px] text-default-400">
            La prochaine course de ce partenaire ira au N°1.
          </p>
        </>
      )}
    </article>
  );
}
