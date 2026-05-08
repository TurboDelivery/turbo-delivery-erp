import { generateWeeks } from '@/lib/week.utils';

const JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
const JOURS_SEMAINE_COURT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;
const JOURS_KEYS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

export const getJourLabel = (jour: string): string => {
  const index = JOURS_KEYS.indexOf(jour.toUpperCase());
  return index >= 0 ? JOURS_SEMAINE[index] : jour;
};

export const getJourCourtLabel = (jour: string): string => {
  const index = JOURS_KEYS.indexOf(jour.toUpperCase());
  return index >= 0 ? JOURS_SEMAINE_COURT[index] : jour;
};

export const formatSemaineLabel = (debut: string, fin: string): string => {
  const debutDate = new Date(`${debut}T00:00:00`);
  const finDate = new Date(`${fin}T00:00:00`);
  const mois = debutDate.toLocaleDateString('fr-FR', { month: 'long' });
  const annee = debutDate.getFullYear();
  return `Semaine du ${debutDate.getDate()} au ${finDate.getDate()} ${mois.charAt(0).toUpperCase() + mois.slice(1)} ${annee}`;
};

export interface SemaineOption {
  value: string;
  label: string;
  debut: string;
  fin: string;
}

/** Date de départ historique des créneaux. */
const CRENEAUX_START_DATE = new Date('2024-12-30T00:00:00');

/**
 * Génère toutes les semaines (lundi→dimanche) du 30 Dec 2024 jusqu'à la semaine courante.
 * Retournées en ordre décroissant (plus récente en premier).
 *
 * Délègue la logique commune à `lib/week.utils.generateWeeks`.
 */
export function generateAllWeeks(): SemaineOption[] {
  return generateWeeks(CRENEAUX_START_DATE).map(({ debut, fin, label }) => ({
    value: debut,
    label,
    debut,
    fin,
  }));
}

/**
 * Retourne le dimanche correspondant à un lundi donné.
 */
export function getSundayFromMonday(monday: string): string {
  const date = new Date(`${monday}T00:00:00`);
  date.setDate(date.getDate() + 6);
  return date.toISOString().split('T')[0];
}

/**
 * Retourne les dates de chaque jour de la semaine à partir du lundi.
 */
export function getWeekDates(monday: string): Record<string, string> {
  const dates: Record<string, string> = {};
  const date = new Date(`${monday}T00:00:00`);

  for (let i = 0; i < 7; i++) {
    const d = new Date(date);
    d.setDate(d.getDate() + i);
    dates[JOURS_KEYS[i]] = d.toISOString().split('T')[0];
  }

  return dates;
}
