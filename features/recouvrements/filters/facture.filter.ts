import { parseAsInteger, parseAsString } from 'nuqs';
export const factureFiltersClient = {
  filter: {
    restaurantId: parseAsString.withDefault(''),
    type: parseAsString.withDefault(''),
    statut: parseAsString.withDefault(''),
    periodeDebut: parseAsString.withDefault(''),
    periodeFin: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(0),
    size: parseAsInteger.withDefault(10),
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