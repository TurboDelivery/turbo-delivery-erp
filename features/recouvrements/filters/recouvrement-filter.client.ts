import { createSearchParamsCache, parseAsInteger, parseAsString } from 'nuqs/server';

export const recouvrementFiltersClient = {
  filter: {
    page: parseAsInteger.withDefault(0),
    size: parseAsInteger.withDefault(10),
    sort: parseAsString.withDefault('dateRecouvrement,desc'),
    search: parseAsString.withDefault(''),
    restaurantId: parseAsString.withDefault(''),
  },
  option: {
    urlKeys: {
      page: 'rec_page',
      size: 'rec_size',
      sort: 'rec_sort',
      search: 'rec_search',
      restaurantId: 'rec_resto',
    },
  },
};

export const recouvrementFiltersClientCache = createSearchParamsCache(recouvrementFiltersClient.filter);

