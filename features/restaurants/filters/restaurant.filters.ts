import { parseAsInteger, parseAsString } from 'nuqs';

export const restaurantFiltersClient = {
  filters: {
    search: parseAsString.withDefault(''),
    limit: parseAsInteger.withDefault(10),
    page: parseAsInteger.withDefault(0),
    orderBy: parseAsString.withDefault('nomEtablissement'),
    orderDirection: parseAsString.withDefault('asc'),
  },
  options: {
    shallow: true,
  },
};

