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
