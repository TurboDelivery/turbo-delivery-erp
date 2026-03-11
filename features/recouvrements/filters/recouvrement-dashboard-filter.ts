import { parseAsIsoDate, parseAsStringEnum } from 'nuqs';
import { startOfMonth } from 'date-fns';

export const recouvrementDashboardFilterClient = {
  filters: {
    debut: parseAsIsoDate.withDefault(startOfMonth(new Date())),
    fin: parseAsIsoDate.withDefault(new Date()),
    tab: parseAsStringEnum(['factures', 'recouvrements', 'restaurants', 'contestations', 'accompte']).withDefault('factures')
  },
}