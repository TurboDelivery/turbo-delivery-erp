import { parseAsInteger, parseAsString, parseAsIsoDate } from 'nuqs';

export const responsableFinancierFilters = {
  filter: {
    periode: parseAsString.withDefault('mois'),
    dateDebut: parseAsIsoDate.withDefault(null as unknown as Date),
    dateFin: parseAsIsoDate.withDefault(null as unknown as Date),
    statut: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(0),
    size: parseAsInteger.withDefault(20),
  },
  option: {
    clearOnDefault: true,
    throttleMs: 300,
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
