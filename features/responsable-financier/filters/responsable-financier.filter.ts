import { parseAsIsoDate, parseAsInteger, parseAsString } from 'nuqs';
import { subMonths } from 'date-fns';

export const responsableFinancierFilters = {
  filter: {
    periode: parseAsString.withDefault('mois'),
    dateDebut: parseAsIsoDate.withDefault(subMonths(new Date(), 1)),
    dateFin: parseAsIsoDate.withDefault(new Date()),
    statut: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(0),
    size: parseAsInteger.withDefault(20),
  },
  option: {
    clearOnDefault: true,
    throttleMs: 500,
    urlKeys: {
      periode: 'rfPeriode',
      dateDebut: 'rfDebut',
      dateFin: 'rfFin',
      statut: 'rfStatut',
      page: 'rfPage',
      size: 'rfSize',
    },
  },
};
