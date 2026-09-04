'use client';

import { IAuditAction } from '../types';
import { changements, libelleChamp } from '../utils/supervision-format.utils';

/** Au-delà, la cellule devient illisible : le reste est annoncé, pas tronqué en silence. */
const CHAMPS_AFFICHES = 3;

/**
 * Détail « avant → après » d'une action.
 *
 * L'ancienne valeur est barrée en rouge, la nouvelle en vert : c'est la lecture
 * qu'attend un contrôleur de gestion qui balaie la colonne — il doit voir ce qui
 * a bougé sans lire, puis lire seulement ce qui l'intrigue.
 */
export function DiffValeurs({ action }: { action: IAuditAction }) {
  const lignes = changements(action);

  if (lignes.length === 0) {
    if (!action.succes && action.erreur) {
      return <span className="text-xs text-danger-soft-foreground">Échec : {action.erreur}</span>;
    }
    return <span className="text-xs text-default-400">—</span>;
  }

  const visibles = lignes.slice(0, CHAMPS_AFFICHES);
  const reste = lignes.length - visibles.length;

  return (
    <div className="space-y-0.5 font-mono text-[11px] leading-relaxed">
      {visibles.map((ligne) => (
        <div key={ligne.champ} className="flex flex-wrap items-baseline gap-1">
          <span className="text-default-500">{libelleChamp(ligne.champ)} :</span>
          <span className="text-danger-soft-foreground line-through decoration-1" title={ligne.avant}>
            {ligne.avant}
          </span>
          <span className="text-default-400">→</span>
          <span className="font-semibold text-success-soft-foreground" title={ligne.apres}>
            {ligne.apres}
          </span>
        </div>
      ))}
      {reste > 0 && (
        <div className="font-sans text-[11px] text-default-400">
          + {reste} autre{reste > 1 ? 's' : ''} champ{reste > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
