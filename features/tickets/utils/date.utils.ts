import { endOfWeek, format, startOfWeek, subWeeks } from 'date-fns';

export function genererListeSemaines(nbSemaines = 52) {
  const semaines: {
    label: string;
    value: string;
  }[] = [];

  const today = new Date();

  for (let i = 0; i <= nbSemaines; i++) {
    const dateRef = subWeeks(today, i);

    const debutSemaine = startOfWeek(dateRef, { weekStartsOn: 1 });
    const finSemaine = endOfWeek(dateRef, { weekStartsOn: 1 });

    const debut = format(debutSemaine, 'dd/MM/yyyy');
    const fin = format(finSemaine, 'dd/MM/yyyy');

    const value = `${debut}-${fin}`;

    semaines.push({
      label: `Semaine du ${debut} au ${fin}`,
      value,
    });
  }

  return semaines;
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
