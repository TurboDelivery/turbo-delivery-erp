import { parseAsString, parseAsInteger } from "nuqs/server";

export const commissionFiltersClient = {
    filter: {
        search: parseAsString.withDefault(''),
        nomRestaurant: parseAsString.withDefault(''),
        createdAt: parseAsString.withDefault(''),
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(10),
    },
    option: {
        clearOnDefault: true,
        throttleMs: 500,
    }
}
