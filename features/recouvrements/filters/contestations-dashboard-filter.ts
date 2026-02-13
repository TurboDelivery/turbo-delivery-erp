import { parseAsIsoDate, parseAsStringEnum } from 'nuqs';
import { startOfMonth } from 'date-fns';

export const contestationsDashboardFilterClient = {
  filters: {
    debut: parseAsIsoDate.withDefault(startOfMonth(new Date())),
    fin: parseAsIsoDate.withDefault(new Date()),
    restaurantId: parseAsStringEnum([''] as const).withDefault(''),
    status: parseAsStringEnum(['', 'ACTIVE', 'RESOLUE'] as const).withDefault(''),
  },
};


