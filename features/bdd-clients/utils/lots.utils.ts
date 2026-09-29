/**
 * Découper un fichier en lots que le serveur accepte.
 *
 * <h3>Pourquoi ce découpage vit ici, et pas dans l'écran</h3>
 * <p>Un lot est borné par `LOT_LIGNES_MAX`, un réglage de base. Un fichier de caisse en
 * porte des milliers. L'écran envoie donc plusieurs lots à la suite, et c'est
 * l'arithmétique de ce découpage qui décide où reprendre après un échec. Or chaque lot
 * parti est ÉCRIT : il n'y a pas de retour en arrière. Un décalage d'une tranche
 * rejouerait des centaines de captures pour des clients déjà créés, et fausserait leurs
 * compteurs, leur segment et leur rang. C'est exactement le genre de calcul qui se lit
 * juste et se trompe, donc il est ici, nu, et sous banc.</p>
 */

/**
 * Coupe en tranches d'au plus `parLot` éléments, dans l'ordre.
 *
 * <p>Un plafond nul ou négatif ne rend RIEN plutôt qu'une tranche : c'est l'état où le
 * serveur n'a pas encore dit sa règle, et envoyer serait deviner.</p>
 */
export function decouper<T>(lignes: T[], parLot: number): T[][] {
  if (!Number.isFinite(parLot) || parLot < 1) return [];
  const tranches: T[][] = [];
  for (let debut = 0; debut < lignes.length; debut += parLot) {
    tranches.push(lignes.slice(debut, debut + parLot));
  }
  return tranches;
}

/** Combien de lots pour ce fichier, avec cette règle. */
export function nombreDeLots(nbLignes: number, parLot: number): number {
  if (!Number.isFinite(parLot) || parLot < 1) return 0;
  return Math.ceil(nbLignes / parLot);
}
