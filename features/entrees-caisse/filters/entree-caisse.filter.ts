import { parseAsInteger, parseAsIsoDate } from 'nuqs';
import { subMonths } from 'date-fns';

export const entreeCaisseFiltersClient = {
  filter: {
    debut: parseAsIsoDate.withDefault(subMonths(new Date(), 1)),
    fin: parseAsIsoDate.withDefault(new Date()),
    page: parseAsInteger.withDefault(0),
    size: parseAsInteger.withDefault(20),
  },
  option: {
    clearOnDefault: true,
    throttleMs: 500,
    urlKeys: {
      debut: 'ecDebut',
      fin: 'ecFin',
      page: 'ecPage',
      size: 'ecSize',
    },
  },
};
