import { parseAsInteger, parseAsIsoDate, parseAsString, SingleParserBuilder } from 'nuqs';
import { endOfWeek, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ILivreurSearchParams } from '@/features/tickets/types/tickets.type';

type LivreursFiltersClient = {
  filters: {
    [K in keyof ILivreurSearchParams]: SingleParserBuilder<any>;
  };
  option: {
    clearOnDefault: boolean;
    throttleMs: number;
  };
};

export const livreursFiltersClient: LivreursFiltersClient = {
  filters: {
    livreur: parseAsString.withDefault(''),
    idLivreur: parseAsString.withDefault(''),
    idRestaurant: parseAsString.withDefault(''),
    creneauDebut: parseAsIsoDate.withDefault(startOfWeek(new Date(), { locale: fr })),
    creneauFin: parseAsIsoDate.withDefault(endOfWeek(new Date(), { locale: fr })),
    livreurPage: parseAsInteger.withDefault(0),
    livreurPageSize: parseAsInteger.withDefault(20),
  },
  option: {
    clearOnDefault: false,
    throttleMs: 500,
  },
};
