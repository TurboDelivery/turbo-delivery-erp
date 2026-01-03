import { parseAsString, parseAsIsoDate } from "nuqs";
import { startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
const start = startOfWeek(new Date(), { locale: fr });
const end = endOfWeek(new Date(), { locale: fr });
export const ticketFiltersSchema = {
  q: parseAsString.withDefault(""),
  livreur: parseAsString.withDefault(""),
  restaurant: parseAsString.withDefault(""),
  dateStart: parseAsIsoDate.withDefault(start),
  dateEnd: parseAsIsoDate.withDefault(end),
  tab: parseAsString.withDefault("tous"),
};
