import {parseAsInteger} from 'nuqs';

/**
 * @constant utilisateurFiltersClient
 * @description Définit les schémas de parsing pour les paramètres de requête d'URL
 * utilisés pour filtrer et paginer la liste des utilisateurs.
 * Chaque propriété correspond à un paramètre d'URL et spécifie son type
 * et sa valeur par défaut.
 */
export const utilisateurFiltersClient = {
    filter: {
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(20),
    },
    option: {
        clearOnDefault: true,
        throttleMs: 500, // 500ms de délai pour les filtres textuels
    }
};