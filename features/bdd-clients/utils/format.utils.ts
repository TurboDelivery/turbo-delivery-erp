/**
 * Les formats de la base clients.
 *
 * <p>Écrits ici plutôt qu'importés du module encours : la règle du dépôt interdit
 * d'atteindre l'intérieur d'une autre feature, et un formateur de montant n'est pas une
 * dépendance qui justifie de l'enfreindre.</p>
 */

/** `21 500 FCFA`. L'espace est insécable : un montant ne se coupe pas en fin de ligne. */
export function formatFcfa(valeur: number | null | undefined): string {
  if (valeur === null || valeur === undefined || Number.isNaN(valeur)) return '—';
  return `${Math.round(valeur).toLocaleString('fr-FR').replace(/ /g, ' ')} FCFA`;
}

export function formatNombre(valeur: number | null | undefined): string {
  if (valeur === null || valeur === undefined || Number.isNaN(valeur)) return '—';
  return valeur.toLocaleString('fr-FR').replace(/ /g, ' ');
}

/** `12 %`, arrondi à l'entier : un taux de recouvrement à la décimale près est du bruit. */
export function formatPourcent(part: number | null | undefined): string {
  if (part === null || part === undefined || Number.isNaN(part)) return '—';
  return `${Math.round(part * 100)} %`;
}

/** `05/04/2026`. L'année sur QUATRE chiffres : une année aberrante doit se voir. */
export function formatJour(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getFullYear()).padStart(4, '0'),
  ].join('/');
}

export const LIBELLES_STATUT: Record<string, string> = {
  A_QUALIFIER: 'À qualifier',
  FUSIONNE: 'Fusionné',
  INJOIGNABLE: 'Injoignable',
  QUALIFIE: 'Qualifié',
  REJETE: 'Rejeté',
};

export const LIBELLES_SEGMENT: Record<string, string> = {
  DORMANT: 'Dormant',
  NOUVEAU: 'Nouveau',
  OCCASIONNEL: 'Occasionnel',
  REGULIER: 'Régulier',
  VIP: 'VIP',
};

export const LIBELLES_CONSENTEMENT: Record<string, string> = {
  NON: 'Non',
  NON_RENSEIGNE: 'Non renseigné',
  OUI: 'Oui',
  PAS_DEMANDE: 'Pas demandé',
};
