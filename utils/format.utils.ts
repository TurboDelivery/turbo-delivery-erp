/**
 * Formate un montant de manière compacte : 2.60 M, 850 K, ou nombre brut
 */
export function formatMontantCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} Md`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M`;
  return n.toLocaleString('fr-FR');
}

/** Suffixe monétaire unique de l'ERP. */
export const SUFFIXE_MONETAIRE = 'FCFA';

/**
 * Formate un montant en FCFA avec séparateurs de milliers.
 *
 * <p>Cette fonction rendait DEUX suffixes différents selon la valeur : « 0 FCFA » écrit en
 * dur pour zéro, et « 1 500 F CFA » pour tout le reste, parce que `Intl` rend la devise
 * XOF sous la forme « F CFA » en français. Les deux se côtoyaient donc dans un même
 * tableau, ce qui se lit comme un défaut d'application.</p>
 *
 * <p>Le suffixe retenu est « FCFA », de loin le plus répandu dans le dépôt : 199
 * occurrences contre 16. L'espace qui le précède est INSÉCABLE, pour que le montant et sa
 * devise ne soient jamais séparés par un retour à la ligne dans une colonne étroite.</p>
 */
export function formatMontant(montant: number): string {
    const nombre = new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(montant);

    return `${nombre}\u00A0${SUFFIXE_MONETAIRE}`;
}

/**
 * Formate un nombre avec séparateurs de milliers.
 *
 * <p>Une valeur absente rend un tiret, pas « NaN ». `Intl.NumberFormat.format(undefined)`
 * rend litteralement la chaine « NaN », et un champ manquant dans une charge utile
 * suffisait a l'afficher en gros sur une carte de statistiques. `formatCFA` se protegeait
 * deja ainsi ; celle-ci ne le faisait pas, et la difference ne se voyait qu'en
 * production.</p>
 */
export function formatNombre(nombre: number | null | undefined): string {
    if (nombre === null || nombre === undefined || !Number.isFinite(nombre)) return '—';
    return new Intl.NumberFormat('fr-FR').format(nombre);
}

/**
 * Formate un pourcentage
 */
export function formatPourcentage(valeur: number): string {
    return `${valeur.toFixed(1)}%`;
}
