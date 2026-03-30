import { parseAsInteger } from 'nuqs';

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

export const payrollFiltersClient = {
  filter: {
    year: parseAsInteger.withDefault(currentYear),
    month: parseAsInteger.withDefault(currentMonth),
  },
  option: {
    clearOnDefault: true,
    throttleMs: 300,
    urlKeys: {
      year: 'pYear',
      month: 'pMonth',
    },
  },
};

