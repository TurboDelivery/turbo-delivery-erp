import { parseAsArrayOf, parseAsInteger, parseAsString } from 'nuqs';

const anneeCourante = new Date().getFullYear();

// Filtres URL (nuqs) de la page ENCOURS. mois '' = « Tous » (cumul annuel) ;
// partenaire '' = « Tous » ; cycle '' = « Tous » ; stores [] = tous les points de vente.
export const encoursFilters = {
  filter: {
    annee: parseAsInteger.withDefault(anneeCourante),
    mois: parseAsString.withDefault(''),
    cycle: parseAsString.withDefault(''),
    partenaire: parseAsString.withDefault(''),
    stores: parseAsArrayOf(parseAsString).withDefault([]),
  },
  option: {
    clearOnDefault: true,
    throttleMs: 400,
    urlKeys: {
      annee: 'enAnnee',
      mois: 'enMois',
      cycle: 'enCycle',
      partenaire: 'enPart',
      stores: 'enStores',
    },
  },
};
