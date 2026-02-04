import { parseAsInteger, parseAsIsoDate, parseAsString } from 'nuqs';
import { subMonths } from 'date-fns';
export const factureFiltersClient = {
  filter: {
    restaurantId: parseAsString.withDefault(''),
    type: parseAsString.withDefault(''),
    statut: parseAsString.withDefault(''),
    periodeDebut: parseAsIsoDate.withDefault(subMonths(new Date(),1)),
    periodeFin: parseAsIsoDate.withDefault(new Date()),
    page: parseAsInteger.withDefault(0),
    size: parseAsInteger.withDefault(20),
    sort: parseAsString.withDefault(''),
  },
  option: {
    clearOnDefault: true,
    throttleMs: 500,
    urlKeys: {
      restaurantId: 'fRestoId',
      type: 'fType',
      statut: 'fStatut',
      periodeDebut: 'fPeriodeDebut',
      periodeFin: 'fPeriodeFin',
      page: 'fPage',
      size: 'fSize',
      sort: 'fSort',
    },
  },
};