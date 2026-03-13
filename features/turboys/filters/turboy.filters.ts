import { parseAsInteger, parseAsString, parseAsStringLiteral } from 'nuqs';

export const turboyFiltersClient = {
  filters: {
    search: parseAsString.withDefault(''),
    limit: parseAsInteger.withDefault(10),
    page: parseAsInteger.withDefault(0),
    orderBy: parseAsString.withDefault('nom'),
    orderDirection: parseAsString.withDefault('asc'),
    typeLivreur: parseAsStringLiteral(['INDEPENDANT', 'JOURNALIER']).withDefault('INDEPENDANT')
  },
  options: {
    shallow: true,
  },
};

