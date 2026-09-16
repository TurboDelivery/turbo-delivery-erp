// Les derogations d'affichage, indexees par chemin. Pur, sans React : le layout SERVEUR
// s'en sert avant de rendre, le fournisseur CLIENT s'en sert pour le reste de la page.

import type { Derogation } from '@/src/privileges/privileges.action';

/**
 * Les derogations qui concernent CE role, rangees par chemin.
 *
 * <p>Le serveur renvoie la table entiere, tous roles confondus : c'est la matrice des
 * privileges qui a besoin de tout voir. Une page, elle, n'est rendue que pour UN role, et
 * appliquer les lignes d'un autre role ouvrirait ou fermerait des ecrans au hasard.</p>
 *
 * <p>La comparaison est insensible a la casse : le role vient d'un libelle saisi en base
 * (`role.libelle`), la derogation d'un choix fait dans l'ecran des privileges. Rien ne
 * garantit qu'ils portent la meme casse, et un ecart de casse rendrait la derogation
 * silencieusement inoperante — le pire des echecs pour un reglage de droits.</p>
 */
export function indexerDerogations(
  derogations: Derogation[] | null | undefined,
  role: string | null | undefined,
): Record<string, boolean> {
  const carte: Record<string, boolean> = {};
  if (!role) return carte;
  const attendu = String(role).toUpperCase();
  for (const d of derogations ?? []) {
    if (d?.chemin && d.role?.toUpperCase() === attendu) carte[d.chemin] = d.autorise;
  }
  return carte;
}
