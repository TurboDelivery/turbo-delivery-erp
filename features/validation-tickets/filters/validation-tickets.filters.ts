import { parseAsString } from 'nuqs';

export const validationTicketFiltersConfig = {
  search: parseAsString.withDefault(''),
  numero: parseAsString.withDefault(''),
  livreurId: parseAsString.withDefault(''),
  restaurantId: parseAsString.withDefault(''),
  debut: parseAsString.withDefault(''),
  fin: parseAsString.withDefault(''),
};

export const validationTicketFiltersOptions = {
  clearOnDefault: true,
  throttleMs: 300,
} as const;

// Filtres dédiés au tableau « Tickets V2 validés » (bas de page verrouillage-v2).
// urlKeys préfixés pour éviter toute collision avec les filtres du tableau du haut
// qui partagent la même page et la même config de parsers.
export const validationTicketV2ValideFiltersOptions = {
  clearOnDefault: true,
  throttleMs: 300,
  urlKeys: {
    search: 'v2_search',
    numero: 'v2_numero',
    livreurId: 'v2_livreurId',
    restaurantId: 'v2_restaurantId',
    debut: 'v2_debut',
    fin: 'v2_fin',
  },
} as const;
