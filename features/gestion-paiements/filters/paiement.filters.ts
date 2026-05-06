import { parseAsString } from 'nuqs';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const now = new Date();

export const paiementFiltersClient = {
  filters: {
    debut: parseAsString.withDefault(format(startOfMonth(now), 'yyyy-MM-dd')),
    fin: parseAsString.withDefault(format(endOfMonth(now), 'yyyy-MM-dd')),
  },
  options: {
    shallow: true,
  },
};
