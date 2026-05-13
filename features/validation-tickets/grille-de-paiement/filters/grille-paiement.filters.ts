import { parseAsInteger, parseAsString } from 'nuqs';

export const grillePaiementFiltersConfig = {
  creneauId: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(0),
};

export const grillePaiementFiltersOptions = {
  clearOnDefault: true,
  throttleMs: 300,
  urlKeys: {
    creneauId: 'creneau',
    page: 'page',
  },
} as const;
