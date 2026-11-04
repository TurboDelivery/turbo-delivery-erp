/**
 * Shared week-generation utility (Monday → Sunday).
 *
 * Both `features/tickets` and `features/creneaux` used to duplicate this
 * logic. They now delegate to `generateWeeks` and keep only their own
 * formatting wrappers.
 */

export interface WeekEntry {
  /** ISO date string for Monday (YYYY-MM-DD) */
  debut: string;
  /** ISO date string for Sunday  (YYYY-MM-DD) */
  fin: string;
  /** Human-readable French label */
  label: string;
}

const capitaliser = (mot: string) => mot.charAt(0).toUpperCase() + mot.slice(1);

const moisLong = (d: Date) => capitaliser(d.toLocaleDateString('fr-FR', { month: 'long' }));
const moisCourt = (d: Date) => capitaliser(d.toLocaleDateString('fr-FR', { month: 'short' }));

/**
 * Le libelle francais d'une semaine.
 *
 * ⚠ UNE SEMAINE NE TIENT PAS TOUJOURS DANS UN MOIS, et ce libelle l'oubliait. Il ne lisait
 * que le mois et l'annee du LUNDI, puis collait la date du dimanche derriere. La semaine
 * 44 de 2026 (26 octobre au 1er novembre) s'affichait donc « Semaine du 26 au 1 Octobre
 * 2026 » dans le selecteur, pendant que le titre de la page, lui, annoncait correctement
 * « 26 Oct. au 1 Nov. ». Le meme ecran se contredisait, et c'est le selecteur qui avait
 * tort. Au passage d'une annee le defaut etait pire : du 29 decembre 2025 au 4 janvier
 * 2026 se lisait « du 29 au 4 Decembre 2025 ».
 *
 * Trois formes, parce qu'il y a trois cas et qu'ecrire le mois deux fois quand il ne change
 * pas alourdit une liste deroulante qu'on parcourt a l'oeil :
 *   meme mois   : « Semaine du 26 au 31 Octobre 2026 »
 *   mois differents : « Semaine du 26 Oct. au 1 Nov. 2026 »
 *   annees differentes : « Semaine du 29 Dec. 2025 au 4 Jan. 2026 »
 */
function buildLabel(debut: string, fin: string): string {
  const debutDate = new Date(`${debut}T00:00:00`);
  const finDate = new Date(`${fin}T00:00:00`);

  if (debutDate.getFullYear() !== finDate.getFullYear()) {
    return `Semaine du ${debutDate.getDate()} ${moisCourt(debutDate)} ${debutDate.getFullYear()}`
      + ` au ${finDate.getDate()} ${moisCourt(finDate)} ${finDate.getFullYear()}`;
  }

  if (debutDate.getMonth() !== finDate.getMonth()) {
    return `Semaine du ${debutDate.getDate()} ${moisCourt(debutDate)}`
      + ` au ${finDate.getDate()} ${moisCourt(finDate)} ${finDate.getFullYear()}`;
  }

  return `Semaine du ${debutDate.getDate()} au ${finDate.getDate()}`
    + ` ${moisLong(debutDate)} ${debutDate.getFullYear()}`;
}

export { buildLabel as formatSemaineLabel };

/**
 * Generates all Monday→Sunday weeks from `startDate` up to today,
 * returned in **descending** order (most recent first).
 *
 * @param startDate - The Monday that starts the very first week.
 * @returns Array of `WeekEntry` objects with ISO `debut`/`fin` strings and a
 *          French label.
 */
export function generateWeeks(startDate: Date): WeekEntry[] {
  const weeks: WeekEntry[] = [];
  const now = new Date();

  const cursor = new Date(startDate);
  // Normalise to midnight to avoid time-zone edge-cases
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= now) {
    const monday = new Date(cursor);
    const sunday = new Date(cursor);
    sunday.setDate(sunday.getDate() + 6);

    const debut = monday.toISOString().split('T')[0];
    const fin = sunday.toISOString().split('T')[0];

    weeks.push({ debut, fin, label: buildLabel(debut, fin) });

    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks.reverse();
}
