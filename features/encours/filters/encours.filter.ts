import { parseAsInteger, parseAsString } from 'nuqs';

const anneeCourante = new Date().getFullYear();

// Filtres URL (nuqs) de la page ENCOURS. mois '' = « Tous » (cumul annuel) ;
// partenaire '' = « Tous ».
export const encoursFilters = {
  filter: {
    annee: parseAsInteger.withDefault(anneeCourante),
    mois: parseAsString.withDefault(''),
    partenaire: parseAsString.withDefault(''),
  },
  option: {
    clearOnDefault: true,
    throttleMs: 400,
    urlKeys: {
      annee: 'enAnnee',
      mois: 'enMois',
      partenaire: 'enPart',
    },
  },
};
