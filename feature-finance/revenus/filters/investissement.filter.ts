import { parseAsString, parseAsInteger } from "nuqs/server";

export const investissementFiltersClient = {
    filter: {
        search: parseAsString.withDefault(''),
        montant: parseAsInteger.withDefault(0),
        dateInvestissement: parseAsString.withDefault(''),
        deadline: parseAsString.withDefault(''),
        nomInvestisseur: parseAsString.withDefault(''),
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(10),
    },
    option: {
        clearOnDefault: true,
        throttleMs: 500,
    }
}
