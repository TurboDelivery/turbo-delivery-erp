import { parseAsString, parseAsIsoDate, SingleParserBuilder, parseAsInteger } from 'nuqs';
import { startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ITicketParams } from '@/features/tickets/types/tickets.type';

const start = startOfWeek(new Date(), { locale: fr });
const end = endOfWeek(new Date(), { locale: fr });

type TicketFiltersClient = {
  filters: {
    [K in keyof ITicketParams]: SingleParserBuilder<any>;
  };
  option: {
    clearOnDefault: boolean;
    throttleMs: number;
  };
};

export const ticketFiltersClient: TicketFiltersClient = {
  filters: {
    search: parseAsString.withDefault(''),
    livreurId: parseAsString.withDefault(''),
    restaurantId: parseAsString.withDefault(''),
    debut: parseAsIsoDate.withDefault(start),
    fin: parseAsIsoDate.withDefault(end),
    tab: parseAsString.withDefault('tous'),
    page: parseAsInteger.withDefault(0),
    size: parseAsInteger.withDefault(150),
  },
  option: {
    clearOnDefault: true,
    throttleMs: 500,
  },
};
