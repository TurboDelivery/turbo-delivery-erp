import { parseAsInteger, parseAsString } from 'nuqs';

const now = new Date();

export const deductionFiltersClient = {
  filter: {
    employeeId: parseAsString.withDefault(''),
    year: parseAsInteger.withDefault(now.getFullYear()),
    month: parseAsInteger.withDefault(now.getMonth() + 1),
    page: parseAsInteger.withDefault(0),
  },
  option: {
    clearOnDefault: true,
    throttleMs: 500,
    urlKeys: {
      employeeId: 'dEmp',
      year: 'dYear',
      month: 'dMonth',
      page: 'dPage',
    },
  },
};
