// Formatage FCFA (séparateur ESPACE simple, pas insécable) + libellés de mois — page ENCOURS.

export const MOIS_COURTS: string[] = [
  '', 'Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.',
];

export const MOIS_LONGS: string[] = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// Espaces insécables produits par Intl (U+202F narrow / U+00A0 no-break) → espace simple.
const ESPACES_INSECABLES = new RegExp('[\\u202f\\u00a0]', 'g');

/** Sépare les milliers par une espace simple. */
export function formatNombre(n?: number | null): string {
  if (n === null || n === undefined) return '—';
  return Math.round(n).toLocaleString('fr-FR').replace(ESPACES_INSECABLES, ' ');
}

/** Montant FCFA formaté « 7 240 400 FCFA ». null/undefined → « — ». */
export function formatFcfa(n?: number | null): string {
  if (n === null || n === undefined) return '—';
  return `${formatNombre(n)} FCFA`;
}
