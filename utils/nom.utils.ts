/**
 * Le nom d'une personne, dans l'ordre du SERVEUR : nom puis prénoms.
 *
 * <h3>Pourquoi cet ordre, et pourquoi un seul endroit</h3>
 * <p>La colonne « Livreur » de la saisie des tickets n'est pas composée par l'ERP : le
 * serveur envoie une chaîne déjà assemblée par {@code UtilisateurBase.nomComplet()}, qui
 * met le nom avant les prénoms. Le filtre « Livreur » du même écran, lui, composait ses
 * options à la main dans l'ordre inverse. L'opérateur lisait « ote azo » dans la ligne,
 * tapait « ote » dans le filtre, et la liste ne proposait rien : le libellé qu'elle cherche
 * commence par « azo ».</p>
 *
 * <p>Le dépôt comptait une cinquantaine de gabarits de nom écrits à la main, ce qui est
 * précisément ce qui a permis à deux ordres de cohabiter. Une fonction unique ne garantit
 * pas seulement l'ordre d'aujourd'hui : elle donne un seul endroit à changer.</p>
 *
 * <p>Le repli sur l'adresse électronique puis le téléphone n'est pas décoratif, c'est celui
 * du serveur. Sans lui, un livreur sans nom s'afficherait « Sans nom » dans la ligne, qui
 * vient du serveur, et autrement dans le filtre : le même défaut, un cran plus bas.</p>
 */
export interface Personne {
  email?: string | null;
  nom?: string | null;
  prenoms?: string | null;
  telephone?: string | null;
}

export function nomComplet(personne?: Personne | null): string {
  if (!personne) return 'Sans nom';

  const assemble = [personne.nom, personne.prenoms]
    .filter((partie): partie is string => typeof partie === 'string' && partie.trim() !== '')
    .map((partie) => partie.trim())
    .join(' ');
  if (assemble) return assemble;

  if (personne.email?.trim()) return personne.email.trim();
  if (personne.telephone?.trim()) return personne.telephone.trim();
  return 'Sans nom';
}
