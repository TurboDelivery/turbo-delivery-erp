'use client';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { formatNombre, nomComplet, type ICandidatFusion } from '@/features/bdd-clients';

/**
 * La dernière chose lue avant une fusion.
 *
 * <h3>Elle nomme les deux côtés, pas « l'élément sélectionné »</h3>
 * <p>Le geste déplace l'historique commercial d'une personne. La fenêtre écrit donc les
 * numéros, le nombre de commandes qui bougent, et ce qu'il advient du numéro absorbé —
 * qui est la question que se pose l'opérateur et à laquelle un libellé générique ne
 * répondrait pas.</p>
 *
 * <p>Elle n'est pas destructive : rien n'est supprimé, et l'annulation restitue tout.
 * Elle garde donc l'accent, pas le rouge. Peindre en danger un geste réversible userait
 * la couleur qui doit rester lisible pour ce qui ne l'est pas.</p>
 */
export function FusionConfirmation({
  cible,
  enAttente,
  onConfirmer,
  onFermer,
  ouvert,
  sources,
}: {
  cible: ICandidatFusion | null;
  enAttente: boolean;
  onConfirmer: () => void;
  onFermer: () => void;
  ouvert: boolean;
  sources: ICandidatFusion[];
}) {
  const commandes = sources.reduce((somme, f) => somme + f.nbCaptures, 0);
  const nomCible = nomComplet(cible?.nom, cible?.prenom);

  return (
    <FenetreAction
      enAttente={enAttente}
      libelleAction={`Fusionner ${sources.length > 1 ? `${sources.length} fiches` : 'la fiche'}`}
      onAction={onConfirmer}
      onFermer={onFermer}
      ouvert={ouvert}
      titre="Fusionner des doublons"
    >
      <p className="text-sm text-foreground">
        La fiche conservée sera <strong className="tabular-nums">{cible?.telephone}</strong>
        {nomCible ? ` (${nomCible})` : ''}.
      </p>

      <div className="rounded-md border border-separator bg-surface-secondary p-3 text-sm">
        <p className="mb-2 text-xs uppercase tracking-wide text-muted">
          Fiches absorbées
        </p>
        <ul className="flex flex-col gap-1">
          {sources.map((f) => (
            <li className="flex items-center justify-between gap-4" key={f.id}>
              <span className="tabular-nums text-foreground">{f.telephone}</span>
              <span className="text-right tabular-nums text-muted">
                {formatNombre(f.nbCaptures)} commande{f.nbCaptures > 1 ? 's' : ''}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center justify-between gap-4 border-t border-separator pt-2">
          <span className="text-muted">Total déplacé</span>
          <span className="text-right font-semibold tabular-nums text-foreground">
            {formatNombre(commandes)} commande{commandes > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted">
        Les numéros absorbés continueront de désigner la fiche conservée : un ticket qui les
        porte s’y rattachera. Rien n’est supprimé, et le journal des fusions permet de
        revenir en arrière à l’identique.
      </p>
    </FenetreAction>
  );
}
