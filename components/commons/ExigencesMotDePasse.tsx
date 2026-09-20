'use client';

import { Check, Circle } from 'lucide-react';

import { EXIGENCES_MOT_DE_PASSE } from '@/utils/mot-de-passe.utils';

/**
 * La règle de mot de passe, cochée au fur et à mesure de la frappe.
 *
 * <h3>Ce que ça remplace</h3>
 * <p>Une phrase de règle affichée une fois, et un refus du serveur après l'aller-retour.
 * Le refus disait « il faut un caractère spécial » à quelqu'un qui venait d'en taper un :
 * le serveur n'en acceptait que trois, `@`, `#` et `_`, et ne le disait nulle part. On
 * relisait la règle, on constatait l'avoir suivie, et on recommençait.</p>
 *
 * <p>Ici chaque exigence est une ligne, et elle se coche quand elle est tenue. Ce qui
 * manque est visible AVANT d'envoyer, et nommé : la ligne du caractère spécial donne des
 * exemples, parce que « spécial » ne désigne rien de précis pour celui qui tape.</p>
 *
 * <h3>La couleur dit quelque chose</h3>
 * <p>Rien n'est peint en rouge. Un champ qu'on vient de commencer n'est pas en faute,
 * il est incomplet : le rouge le dirait en erreur dès le premier caractère. Le vert
 * marque ce qui est acquis, le gris ce qui reste, et c'est tout.</p>
 */
export function ExigencesMotDePasse({ valeur }: { valeur: string }) {
  return (
    <ul className="mt-1 flex flex-col gap-1" aria-live="polite">
      {EXIGENCES_MOT_DE_PASSE.map((exigence) => {
        const tenue = exigence.tenue(valeur);
        return (
          <li
            className={`flex items-center gap-1.5 text-xs ${
              tenue ? 'text-success-soft-foreground' : 'text-muted'
            }`}
            key={exigence.libelle}
          >
            {tenue ? (
              <Check aria-hidden="true" className="size-3.5 shrink-0" />
            ) : (
              <Circle aria-hidden="true" className="size-3.5 shrink-0" />
            )}
            <span>{exigence.libelle}</span>
            {/* Le lecteur d'écran a besoin du mot, l'icône ne lui dit rien. */}
            <span className="sr-only">{tenue ? ' : rempli' : ' : manquant'}</span>
          </li>
        );
      })}
    </ul>
  );
}
