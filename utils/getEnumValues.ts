
/**
 * @function getEnumValues
 * @description Fonction utilitaire pour extraire les valeurs de chaîne d'un enum TypeScript.
 * Elle est nécessaire pour `parseAsStringEnum` de Nuqs, qui a besoin d'un tableau
 * de toutes les valeurs de chaîne possibles de l'enum pour valider le paramètre d'URL.
 * @param {T} enumObject L'objet enum (ex: UtilisateurRole, UtilisateurStatus).
 * @returns {Array<T[keyof T]>} Un tableau des valeurs de chaîne de l'enum.
 */
export function getEnumValues<T extends Record<string, any>>(enumObject: T): Array<T[keyof T]> {
    return Object.values(enumObject).filter(value => typeof value === 'string') as Array<T[keyof T]>;
}
