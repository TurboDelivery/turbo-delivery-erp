import { format, startOfWeek, subWeeks } from 'date-fns';
import { generateWeeks } from '@/lib/week.utils';

/**
 * Génère la liste des `nbSemaines` dernières semaines (lundi→dimanche),
 * en ordre décroissant (plus récente en premier).
 *
 * Le `value` utilise le format "DD/MM/YYYY-DD/MM/YYYY" spécifique aux tickets.
 * La logique de génération est déléguée à `lib/week.utils.generateWeeks`.
 */
export function genererListeSemaines(nbSemaines = 52) {
  // Calcul de la date de début : lundi de la semaine il y a nbSemaines semaines.
  const startMonday = startOfWeek(subWeeks(new Date(), nbSemaines), { weekStartsOn: 1 });

  return generateWeeks(startMonday).map(({ debut, fin, label }) => {
    // Convertir les dates ISO en format DD/MM/YYYY pour la valeur tickets.
    const debutFr = debut.split('-').reverse().join('/');
    const finFr = fin.split('-').reverse().join('/');
    return {
      label,
      value: `${debutFr}-${finFr}`,
    };
  });
}

export function obtenirDatesDepuisSemaine(semaine: string) {
  const [debutStr, finStr] = semaine.split('-');

  const debutDate = new Date(
    debutStr
      .split('/')
      .reverse()
      .map((part) => parseInt(part, 10))
      .join('-'),
  );
  const finDate = new Date(
    finStr
      .split('/')
      .reverse()
      .map((part) => parseInt(part, 10))
      .join('-'),
  );

  return { debutDate, finDate };
}


export function obtenirKeySemaine(debut: Date, fin: Date) {
  const debutStr = format(debut, 'dd/MM/yyyy');
  const finStr = format(fin, 'dd/MM/yyyy');


  return `${debutStr}-${finStr}`;
}
