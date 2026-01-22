import { parseAsString, parseAsInteger, createSerializer } from "nuqs/server";

export const recouvrementFiltersClient = {
    filter: {
        search: parseAsString.withDefault(''),
        factureId: parseAsString.withDefault(''),
        dateRecouvrement: parseAsString.withDefault(''),
        nomRestaurant: parseAsString.withDefault(''),
        montant: parseAsInteger.withDefault(0),
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(10),
    },
    option: {
        clearOnDefault: true,
        throttleMs: 500,
       
    }
}
export const recouvrementSerializer = createSerializer(recouvrementFiltersClient.filter)
