import { parseAsInteger, parseAsString, parseAsStringLiteral } from 'nuqs';

// V54 (2026-05) — Ajout du tab 'superviseur_livreur' aligné sur la note de
// cadrage DGA du 28/05/2026. Permet à la RH/Comptable de filtrer la liste
// des livreurs sur la nouvelle population.
export const TAB_VALUES = ['all', 'journalier', 'independant', 'superviseur_livreur', 'demandes'] as const;
export const VIEW_MODE_VALUES = ['list', 'grid'] as const;

export const turboyFiltersClient = {
  filters: {
    search: parseAsString.withDefault(''),
    limit: parseAsInteger.withDefault(10),
    page: parseAsInteger.withDefault(0),
    orderBy: parseAsString.withDefault('nom'),
    orderDirection: parseAsString.withDefault('asc'),
    typeLivreur: parseAsStringLiteral(['INDEPENDANT', 'JOURNALIER', 'SUPERVISEUR_LIVREUR']),
    tab: parseAsStringLiteral(TAB_VALUES).withDefault('all'),
    viewMode: parseAsStringLiteral(VIEW_MODE_VALUES).withDefault('list'),
  },
  options: {
    shallow: true,
  },
};

