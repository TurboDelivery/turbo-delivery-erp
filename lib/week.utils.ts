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

/**
 * Builds a French label for a week: "Semaine du <D> au <D> <Mois> <YYYY>".
 */
function buildLabel(debut: string, fin: string): string {
  const debutDate = new Date(`${debut}T00:00:00`);
  const finDate = new Date(`${fin}T00:00:00`);
  const mois = debutDate.toLocaleDateString('fr-FR', { month: 'long' });
  const annee = debutDate.getFullYear();
  return `Semaine du ${debutDate.getDate()} au ${finDate.getDate()} ${mois.charAt(0).toUpperCase() + mois.slice(1)} ${annee}`;
}

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
