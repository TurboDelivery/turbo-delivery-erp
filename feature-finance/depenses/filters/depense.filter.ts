import { parseAsString, parseAsInteger } from "nuqs";

export const depenseFiltersClient = {
    filter: {
        categorie: parseAsString.withDefault(''),
        description: parseAsString.withDefault(''),
        montant: parseAsInteger.withDefault(0),
        dateDepense: parseAsString.withDefault(''),
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(10),
    },
    option: {
        clearOnDefault: true,
        throttleMs: 500,
    }
}
