import type { LotStatut } from '../types/historique-creneaux.type';

/*
 * Les huit teintes etaient CLAIRES uniquement — `bg-*-100 text-*-700`. Depuis que la
 * bascule de theme est dans l'en-tete, ces pastilles s'affichaient en pastel sur fond
 * sombre, illisibles. Chaque etat porte desormais son couple sombre.
 *
 * HeroUI v3 offre une echelle d'etat (success / warning / danger), mais elle n'a que
 * trois crans : la chaine de validation d'un lot en compte HUIT, et les distinguer d'un
 * coup d'oeil dans un tableau dense est tout l'interet de la pastille. La couleur est
 * donc fournie ici, faute d'equivalent, et le LIBELLE reste toujours ecrit — une
 * information qui ne tient qu'a la teinte est perdue pour un daltonien.
 */

export const LOT_STATUT_CONFIG: Record<LotStatut, { label: string; className: string }> = {
  EN_ATTENTE:        { label: 'En attente',        className: 'bg-surface-secondary text-foreground' },
  CALCUL_EN_COURS:   { label: 'En préparation',    className: 'bg-blue-100 text-blue-900 dark:bg-blue-400/15 dark:text-blue-300' },
  SOUMIS_DGA:        { label: 'Soumis DGA',        className: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-400/15 dark:text-indigo-300' },
  VALIDE_DGA:        { label: 'Visé DGA',          className: 'bg-violet-100 text-violet-900 dark:bg-violet-400/15 dark:text-violet-300' },
  APPROUVE_DG:       { label: 'Approuvé PDG',      className: 'bg-purple-100 text-purple-900 dark:bg-purple-400/15 dark:text-purple-300' },
  PAIEMENT_EN_COURS: { label: 'Paiement en cours', className: 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-300' },
  SOLDE:             { label: 'Soldé',             className: 'bg-green-100 text-green-900 dark:bg-green-400/15 dark:text-green-300' },
  REJETE:            { label: 'Rejeté',            className: 'bg-red-100 text-red-900 dark:bg-red-400/15 dark:text-red-300' },
};

export function getLotStatutConfig(statut: string | null | undefined) {
  return LOT_STATUT_CONFIG[(statut as LotStatut)] ?? { label: statut ?? '—', className: 'bg-surface-secondary text-muted' };
}
