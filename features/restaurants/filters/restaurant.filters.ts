import { parseAsInteger, parseAsString } from 'nuqs';

export const restaurantFiltersClient = {
  filters: {
    search: parseAsString.withDefault(''),
    limit: parseAsInteger.withDefault(10),
    page: parseAsInteger.withDefault(0),
    orderBy: parseAsString.withDefault('nomEtablissement'),
    orderDirection: parseAsString.withDefault('asc'),
    localisation: parseAsString.withDefault(''),
    email: parseAsString.withDefault(''),
    telephone: parseAsString.withDefault(''),
    commune: parseAsString.withDefault(''),
    methodRecouvrement: parseAsString.withDefault(''),
  },
  options: {
    shallow: true,
  },
};

