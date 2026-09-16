'use client';

import { Button } from '@heroui-v3/react';

import { IAuditAction } from '../types';
import { changements } from '../utils/supervision-format.utils';

/** Au-delà, la cellule devient illisible : le reste s'ouvre, il n'est plus perdu. */
const CHAMPS_AFFICHES = 3;

/**
 * Détail « avant → après » d'une action, dans la ligne du journal.
 *
 * <h3>Ce que la cellule montrait, et pourquoi c'était illisible</h3>
 * <p>Elle prenait les TROIS PREMIERS champs de l'objet, c'est-à-dire les trois premiers dans
 * l'ordre alphabétique des propriétés Hibernate. Sur la création d'une course partenaire à
 * quarante champs, cela donnait « Client Id : ∅ → ∅ », « Commission : ∅ → 0 » et
 * « Commission Fixe : ∅ → 200 », puis « + 37 autres champs ». La première ligne n'apprenait
 * rien, les deux suivantes étaient choisies par l'alphabet, et le montant, le statut et le
 * numéro dormaient dans les trente-sept cachés.</p>
 *
 * <p>Trois corrections. Les champs sont classés par utilité, pas par alphabet. Une ligne dont
 * les deux côtés sont vides ne prend plus une des trois places. Et le compteur, qui était une
 * impasse, devient le bouton qui ouvre la totalité.</p>
 *
 * <h3>La couleur, et ce qu'elle dit</h3>
 * <p>Le rouge barré et le vert gras restent sur les MODIFICATIONS, où ils disent « ceci a
 * changé ». Sur une création, les quarante lignes seraient vertes et la couleur ne dirait
 * plus rien : l'ancienne valeur n'existe pas, la flèche non plus.</p>
 */
export function DiffValeurs({
  action,
  onVoirTout,
}: {
  action: IAuditAction;
  onVoirTout?: () => void;
}) {
  const lignes = changements(action);

  if (lignes.length === 0) {
    if (!action.succes && action.erreur) {
      return <span className="text-xs text-danger-soft-foreground">Échec : {action.erreur}</span>;
    }
    return <span className="text-xs text-muted">—</span>;
  }

  /*
   * Une ligne « vide → vide » est un champ resté nul à la création. Elle est comptée, elle
   * s'ouvre avec les autres, mais elle ne vole pas une des trois places visibles.
   */
  const parlantes = lignes.filter((l) => !l.vide);
  const visibles = (parlantes.length > 0 ? parlantes : lignes).slice(0, CHAMPS_AFFICHES);

  /*
   * La fleche suit le TYPE D'ACTION, pas la presence des valeurs. Une modification qui part
   * de rien — « Creneau : vide -> #36362945 » — reste une modification : deduire le contraire
   * de l'absence d'ancienne valeur ferait disparaitre le fait que le champ etait VIDE avant,
   * qui est precisement ce que la ligne raconte. Sur une creation ou une suppression, en
   * revanche, il n'y a rien de l'autre cote et la fleche n'aurait rien a montrer.
   */
  const estUneModification = action.typeAction === 'MODIFICATION';

  return (
    <div className="space-y-0.5 text-xs leading-relaxed">
      {visibles.map((ligne) => (
        <div className="flex flex-wrap items-baseline gap-x-1.5" key={ligne.champ}>
          <span className="text-muted">{ligne.libelle} :</span>

          {estUneModification && (
            <>
              <span
                className="tabular-nums text-danger-soft-foreground line-through decoration-1"
                title={String(ligne.avantBrut ?? '')}
              >
                {ligne.avant}
              </span>
              <span aria-hidden="true" className="text-muted">
                →
              </span>
              <span className="sr-only">devient</span>
            </>
          )}

          <span
            className={
              estUneModification
                ? 'font-semibold tabular-nums text-success-soft-foreground'
                : 'font-medium tabular-nums text-foreground'
            }
            title={String((estUneModification ? ligne.apresBrut : (ligne.apresBrut ?? ligne.avantBrut)) ?? '')}
          >
            {estUneModification ? ligne.apres : (ligne.apresBrut != null ? ligne.apres : ligne.avant)}
          </span>
        </div>
      ))}

      {/*
       * « + 37 autres champs » était une impasse : le nombre était juste, et rien ne
       * permettait d'y accéder. Le compteur annonce désormais le TOTAL et ouvre la liste.
       */}
      {lignes.length > visibles.length &&
        (onVoirTout ? (
          <Button className="-ms-2 h-auto px-2 py-0.5 text-xs" onPress={onVoirTout} size="sm" variant="ghost">
            Voir les {lignes.length} champs
          </Button>
        ) : (
          <span className="text-xs text-muted">
            + {lignes.length - visibles.length} autre{lignes.length - visibles.length > 1 ? 's' : ''} champ
            {lignes.length - visibles.length > 1 ? 's' : ''}
          </span>
        ))}
    </div>
  );
}
