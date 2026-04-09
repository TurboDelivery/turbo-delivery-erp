import { parseAsInteger, parseAsString } from 'nuqs';

// Semaine courante (lundi)
function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export const creneauFiltersClient = {
  filter: {
    semaine: parseAsString.withDefault(getCurrentWeekMonday()),
    page: parseAsInteger.withDefault(0),
    search: parseAsString.withDefault(''),
  },
  option: {
    clearOnDefault: true,
    throttleMs: 500,
    urlKeys: {
      semaine: 'cSem',
      page: 'cPage',
      search: 'cSearch',
    },
  },
};
