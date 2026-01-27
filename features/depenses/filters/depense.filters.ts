import { parseAsArrayOf, parseAsInteger, parseAsIsoDate, parseAsString } from 'nuqs';
import { endOfMonth, getYear, startOfMonth } from 'date-fns';

export const depenseFiltersClient = {
  filters: {
    debut: parseAsIsoDate.withDefault(startOfMonth(new Date())),
    fin: parseAsIsoDate.withDefault(endOfMonth(new Date())),
    categoriesDepense: parseAsArrayOf(parseAsString.withDefault('')).withDefault([]),
    limit: parseAsInteger.withDefault(10),
    page: parseAsInteger.withDefault(0),
    orderBy: parseAsString.withDefault('date_depense'),
    orderDirection: parseAsString.withDefault('desc'),
  },
};

export const lineChartDepenseFiltersClient = {
  filters: {
    year: parseAsString.withDefault(getYear(new Date()).toString()),
  },
};
