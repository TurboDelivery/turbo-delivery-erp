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

/** Montant compact pour les cartes/axes : « 7,2 M », « 845 k ». */
export function formatCompact(n?: number | null): string {
  if (n === null || n === undefined) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace('.', ',')} M`;
  if (abs >= 1_000) return `${Math.round(n / 1_000)} k`;
  return formatNombre(n);
}

export const CYCLE_LABEL: Record<string, string> = { QUINZAINE: 'Quinzaine', MENSUEL: 'Mensuel' };

export function cycleLabel(c?: string | null): string {
  if (!c) return '—';
  return CYCLE_LABEL[c] ?? c;
}

/** KPI dérivés du relevé (facturé, reste/encours, déductions, recouvré, taux %). */
export function computeKpis(input: {
  totalFacture?: number;
  totalReste?: number;
  totalDeductions?: number;
}) {
  const facture = input.totalFacture || 0;
  const reste = input.totalReste || 0;
  const deductions = input.totalDeductions || 0;
  const recouvre = Math.max(0, facture - reste - deductions);
  const taux = facture > 0 ? Math.round((recouvre / facture) * 100) : 0;
  return { facture, reste, deductions, recouvre, taux };
}
