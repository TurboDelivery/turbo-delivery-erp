/**
 * Formate un montant de manière compacte : 2.60 M, 850 K, ou nombre brut
 */
export function formatMontantCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} Md`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M`;
  return n.toLocaleString('fr-FR');
}

/**
 * Formate un montant en FCFA avec séparateurs de milliers
 */
export function formatMontant(montant: number): string {
    if (montant === 0) return "0 FCFA";
    
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(montant);
}

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formatNombre(nombre: number): string {
    return new Intl.NumberFormat('fr-FR').format(nombre);
}

/**
 * Formate un pourcentage
 */
export function formatPourcentage(valeur: number): string {
    return `${valeur.toFixed(1)}%`;
}
