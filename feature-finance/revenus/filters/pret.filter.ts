import { parseAsString, parseAsInteger } from "nuqs/server";

export const pretFiltersClient = {
    filter: {
        search: parseAsString.withDefault(''),
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(10),
        nomRestaurant: parseAsString.withDefault(''),
        
    },
    option: {
        clearOnDefault: true,
        throttleMs: 500,
    }
}
