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
