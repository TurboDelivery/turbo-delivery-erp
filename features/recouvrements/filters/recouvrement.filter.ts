import { parseAsInteger, parseAsIsoDate, parseAsString } from 'nuqs';
import { startOfMonth } from 'date-fns';

export const recouvrementFiltersClient = {
  filter: {
    search: parseAsString.withDefault(''),
    factureId: parseAsString.withDefault(''),
    dateRecouvrement: parseAsString.withDefault(''),
    nomRestaurant: parseAsString.withDefault(''),
    montant: parseAsInteger.withDefault(0),
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10),
  },
  option: {
    clearOnDefault: true,
    throttleMs: 500,
  },
};

export const restaurantsRecouvrementFiltersClient = {
  filter: {
    restoId: parseAsString.withDefault(''),
    debut: parseAsIsoDate.withDefault(startOfMonth(new Date())),
    fin: parseAsIsoDate.withDefault(new Date()),
    page: parseAsInteger.withDefault(0),
    limit: parseAsInteger.withDefault(10),
  },
  option: {
    clearOnDefault: true,
    throttleMs: 500,
  },
};
