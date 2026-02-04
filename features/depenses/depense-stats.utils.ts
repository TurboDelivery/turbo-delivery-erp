import { MonthlyStats, YearlyStats } from '@/feature-finance/dashboard/types/dashboard.types';

export type RecupereDonneesResult = {
  date: string;
  data: {
    count: number;
    montant: number;
  };
};

export function recupererDonnees(data: YearlyStats, categorie: keyof MonthlyStats, annee: number | null = null): RecupereDonneesResult[] {
  const resultat: RecupereDonneesResult[] = [];

  const annees = annee ? [annee.toString()] : Object.keys(data);

  annees.forEach((year) => {
    if (!data[year]) return;

    Object.keys(data[year]).forEach((mois) => {
      const moisData = data[year][mois];
      if (moisData[categorie]) {
        const dateFormatee = `${year}-${mois.padStart(2, '0')}-01`;

        resultat.push({
          date: dateFormatee,
          data: {
            count: moisData[categorie].count,
            montant: moisData[categorie].montant,
          },
        });
      }
    });
  });

  return resultat;
}
