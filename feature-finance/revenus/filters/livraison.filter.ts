import { parseAsString, parseAsInteger } from "nuqs/server";

export const livraisonFiltersClient = {
    filter: {
        search: parseAsString.withDefault(''),
        nomLivreur: parseAsString.withDefault(''),
        nomRestaurant: parseAsString.withDefault(''),
        createdAt: parseAsString.withDefault(''),
        fraisLivraison: parseAsInteger.withDefault(0),
        dateLivraison: parseAsString.withDefault(''),
        page: parseAsInteger.withDefault(1),
        limit: parseAsInteger.withDefault(10),
    },
    option: {
        clearOnDefault: true,
        throttleMs: 500,
    }
}
