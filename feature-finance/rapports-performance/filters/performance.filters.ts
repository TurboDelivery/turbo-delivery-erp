import { parseAsIsoDate, parseAsString } from 'nuqs';
import { endOfMonth, startOfMonth } from 'date-fns';

export const performanceFiltersClient = {
  filters: {
    debut: parseAsIsoDate.withDefault(startOfMonth(new Date())),
    fin: parseAsIsoDate.withDefault(endOfMonth(new Date())),
    restaurantId: parseAsString.withDefault(''),
  },
  options: {
    shallow: true,
  },
};
