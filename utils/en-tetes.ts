/**
 * En-tetes poses par le middleware a destination des composants serveur.
 *
 * <p>Ce module ne contient QUE des constantes, et n'importe rien. C'est
 * volontaire : `middleware.ts` s'execute dans le runtime Edge, et importer quoi
 * que ce soit depuis ce fichier ferait entrer du code Edge dans le bundle serveur
 * Node. Les deux cotes lisent donc la constante ICI.</p>
 */

/** Chemin de la requete courante. Un layout Next ne le recoit pas autrement. */
export const EN_TETE_CHEMIN = 'x-chemin';
