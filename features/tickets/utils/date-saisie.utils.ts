import { getLocalTimeZone, today, type CalendarDate, type DateValue } from '@internationalized/date';

/**
 * Les bornes d'une date de ticket.
 *
 * <h3>Pourquoi des bornes</h3>
 * <p>Le champ de date est SEGMENTE : jour, mois, année, chacun se tape séparément. Taper
 * « 26 » dans le segment de l'année pose l'an 26, pas 2026, et rien ne s'y opposait. Le
 * 16/09/2026, soixante-huit des soixante-dix tickets en régularisation portaient l'année
 * 0026. Le serveur les a marqués « Tardif » à juste titre, ils sont sortis du filtre de
 * période, et l'écran les affichait « 14/09/26 » : une saisie fausse, invisible des deux
 * côtés.</p>
 *
 * <p>Une borne est la seule réponse qui tienne. Un message d'erreur après coup suppose que
 * quelqu'un relise ; ici le champ refuse la valeur au moment où elle est tapée, et le
 * calendrier grise ce qui est hors plage.</p>
 *
 * <p>Les fonctions sont appelées au RENDU, pas figées à l'import : un poste reste ouvert
 * plusieurs jours, et une borne calculée une fois vieillirait avec lui.</p>
 */

/** Un an en arrière : au-delà, aucun créneau n'est réouvrable. */
const RECUL_MAXIMAL_EN_ANNEES = 1;

/** Le premier jour saisissable. */
export function premierJourSaisissable(): CalendarDate {
  return today(getLocalTimeZone()).subtract({ years: RECUL_MAXIMAL_EN_ANNEES });
}

/**
 * Le dernier jour saisissable : AUJOURD'HUI.
 *
 * <p>Un bon se saisit après la course, jamais avant. Le serveur refuse déjà une date
 * postérieure au jour à la création ; la borne le dit à l'opérateur avant l'aller-retour,
 * et couvre la modification, que le serveur ne garde pas.</p>
 */
export function dernierJourSaisissable(): CalendarDate {
  return today(getLocalTimeZone());
}

/**
 * Cette date peut-elle etre celle d'un ticket ?
 *
 * <p>Les bornes posees sur le champ marquent la saisie comme invalide, mais React Aria
 * appelle quand meme `onChange` avec la valeur hors plage : elle atteindrait donc le
 * serveur. Cette garde est le verrou, les bornes sont le panneau.</p>
 */
export function dateSaisissable(valeur: DateValue | null | undefined): boolean {
  if (!valeur) return false;
  return (
    valeur.compare(premierJourSaisissable()) >= 0 && valeur.compare(dernierJourSaisissable()) <= 0
  );
}
