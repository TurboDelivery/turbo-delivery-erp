import { parseAsInteger, parseAsString, parseAsStringLiteral } from 'nuqs';

export const TAB_VALUES = ['all', 'journalier', 'independant', 'demandes'] as const;
export const VIEW_MODE_VALUES = ['list', 'grid'] as const;

export const turboyFiltersClient = {
  filters: {
    search: parseAsString.withDefault(''),
    limit: parseAsInteger.withDefault(10),
    page: parseAsInteger.withDefault(0),
    orderBy: parseAsString.withDefault('nom'),
    orderDirection: parseAsString.withDefault('asc'),
    typeLivreur: parseAsStringLiteral(['INDEPENDANT', 'JOURNALIER']),
    tab: parseAsStringLiteral(TAB_VALUES).withDefault('all'),
    viewMode: parseAsStringLiteral(VIEW_MODE_VALUES).withDefault('list'),
  },
  options: {
    shallow: true,
  },
};

