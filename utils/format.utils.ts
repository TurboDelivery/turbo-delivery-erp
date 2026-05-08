/**
 * Formate un montant de manière compacte : 2.60 M, 850 K, ou nombre brut
 */
export function formatMontantCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K`;
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
 * Formate un montant en CFA/XOF (source canonique unique)
 * Alias de référence pour tous les consommateurs de formatCFA / formatCfa
 */
export function formatCfa(amount: number | string | undefined): string {
    const n = typeof amount === 'string' ? parseFloat(amount) || 0 : (amount ?? 0);
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n);
}

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formatNombre(nombre: number | string): string {
    const n = typeof nombre === 'string' ? parseFloat(nombre) || 0 : nombre;
    return new Intl.NumberFormat('fr-FR').format(n);
}

/**
 * Formate un pourcentage
 */
export function formatPourcentage(valeur: number): string {
    return `${valeur.toFixed(1)}%`;
}
