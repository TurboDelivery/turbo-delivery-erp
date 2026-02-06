import { parseAsIsoDate } from 'nuqs';
import { endOfMonth, startOfMonth } from 'date-fns';

export const investissementStatsFiltersClient = {
  filters: {
    debut: parseAsIsoDate.withDefault(startOfMonth(new Date())),
    fin: parseAsIsoDate.withDefault(endOfMonth(new Date())),
  },
  options: {
    shallow: true,
  },
};

