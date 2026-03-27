import { parseAsInteger } from 'nuqs';

const currentMonth = new Date().getMonth() + 1;

export const payrollFiltersClient = {
  filter: {
    month: parseAsInteger.withDefault(currentMonth),
  },
  option: {
    clearOnDefault: true,
    throttleMs: 300,
    urlKeys: {
      month: 'pMonth',
    },
  },
};

