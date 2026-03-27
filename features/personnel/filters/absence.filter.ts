import { parseAsInteger, parseAsIsoDate, parseAsString } from 'nuqs';
import { subMonths } from 'date-fns';

export const absenceFiltersClient = {
  filter: {
    employeeId: parseAsString.withDefault(''),
    type: parseAsString.withDefault(''),
    periodeDebut: parseAsIsoDate.withDefault(subMonths(new Date(), 1)),
    periodeFin: parseAsIsoDate.withDefault(new Date()),
    page: parseAsInteger.withDefault(0),
    size: parseAsInteger.withDefault(20),
    sort: parseAsString.withDefault(''),
  },
  option: {
    clearOnDefault: true,
    throttleMs: 500,
    urlKeys: {
      employeeId: 'aEmp',
      type: 'aType',
      periodeDebut: 'aDebut',
      periodeFin: 'aFin',
      page: 'aPage',
      size: 'aSize',
      sort: 'aSort',
    },
  },
};

