import { IJourProgramme } from '@/features/turboys/types/programme.types';

/**
 * Les calculs purs de la semaine d'un programme : durée d'un jour, fin après minuit,
 * contrôles de saisie.
 *
 * <p>Ils vivent ici, et pas dans l'éditeur, pour être testés en environnement node sans
 * monter un DOM ni la bibliothèque de composants. C'est la convention du dépôt : les
 * tests sont à côté de ce qu'ils testent, et ce qu'on teste est du calcul.</p>
 */

const hhmm = (t?: string | null) => (t ? t.slice(0, 5) : '');

/** Minutes depuis minuit, ou null si l'heure est absente ou illisible. */
export function minutesDepuisMinuit(t?: string | null): number | null {
  const v = hhmm(t);
  if (!/^\d{2}:\d{2}$/.test(v)) return null;
  const [h, m] = v.split(':').map(Number);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

/**
 * Durée d'un jour de service, en minutes, FIN APRÈS MINUIT COMPRISE.
 *
 * <p>Un service 11:00 → 00:00 ne dure pas moins zéro minute : il finit le lendemain. La
 * liste l'écrit « 11:00–00:00 +1 » (RG-L02), et le total d'heures de l'en-tête doit
 * compter pareil, sans quoi une semaine de nuit afficherait des heures négatives.</p>
 */
export function dureeMinutes(j: IJourProgramme): number {
  const d = minutesDepuisMinuit(j.debut);
  const f = minutesDepuisMinuit(j.fin);
  if (d === null || f === null) return 0;
  return f > d ? f - d : f + 24 * 60 - d;
}

/** Vrai quand le service finit après minuit : la liste ajoute « +1 ». */
export function finitApresMinuit(j: IJourProgramme): boolean {
  const d = minutesDepuisMinuit(j.debut);
  const f = minutesDepuisMinuit(j.fin);
  return d !== null && f !== null && f <= d;
}

/** Total d'heures des jours travaillés, arrondi, pour la barre de résumé (§6.5). */
export function heuresSemaine(jours: IJourProgramme[]): number {
  return Math.round(jours.filter((j) => j.actif).reduce((n, j) => n + dureeMinutes(j), 0) / 60);
}

/** Une erreur bloquante ou un avertissement, sur la ligne d'un jour. */
export interface AnomalieJour {
  bloquante: boolean;
  jour: string;
  message: string;
}

/**
 * Les contrôles de §6.5, calculés en direct et rendus SUR LA LIGNE concernée.
 *
 * <p>Descente à la même heure que la montée est bloquant, et horaires incomplets aussi.
 * Un jour travaillé sans site coché l'est également (RG-S03), mais seulement quand il y
 * a un vrai choix à faire : avec un site unique, la base est cochée d'office et exiger
 * un clic serait une formalité vide.</p>
 *
 * <p>Un jour travaillé à zéro franc n'est PAS bloquant. Le carburant se saisit parfois
 * après le planning, et bloquer obligerait à inventer un montant pour pouvoir
 * enregistrer. La spec le dit expressément : avertissement « Sans carburant », non
 * bloquant.</p>
 */
export function anomaliesJours(
  jours: IJourProgramme[],
  sitesParJour: Record<string, string[]>,
  sitesDisponibles: number,
): AnomalieJour[] {
  const out: AnomalieJour[] = [];
  for (const j of jours) {
    if (!j.actif) continue;
    const d = minutesDepuisMinuit(j.debut);
    const f = minutesDepuisMinuit(j.fin);
    if (d === null || f === null) {
      out.push({ bloquante: true, jour: j.jour, message: 'Horaires incomplets.' });
    } else if (d === f) {
      out.push({
        bloquante: true,
        jour: j.jour,
        message: 'La descente ne peut pas être à la même heure que la montée.',
      });
    }
    if (sitesDisponibles > 1 && (sitesParJour[j.jour] ?? []).length === 0) {
      out.push({ bloquante: true, jour: j.jour, message: 'Aucun site coché pour ce jour travaillé.' });
    }
    if (j.montantCarburant == null || j.montantCarburant === 0) {
      out.push({ bloquante: false, jour: j.jour, message: 'Sans carburant.' });
    }
  }
  return out;
}
