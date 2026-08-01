import type { FilleAttenteVM, ILocalDataTime } from '@/types/file-attente.model';

/**
 * Reconstitue l'instant d'entrée en file à partir de `dateJour` + `heureJour`.
 *
 * <p>Le backend sérialise `LocalTime` selon sa configuration Jackson du moment :
 * chaîne `"14:32:05"`, tableau `[14, 32, 5]` ou objet `{hour, minute, second}`.
 * Les trois formes ont déjà circulé sur cette route — on les accepte toutes
 * plutôt que de parier sur l'une d'elles.</p>
 *
 * <p>Aucune conversion de fuseau : `LocalDate`/`LocalTime` n'en portent pas.
 * L'heure est donc lue telle quelle, dans le fuseau du poste de travail — le
 * back-office et les restaurants sont sur le même (Abidjan).</p>
 */
export function instantEntree(ligne: FilleAttenteVM): Date | null {
  const heure = lireHeure(ligne.heureJour);
  if (!ligne.dateJour || !heure) return null;

  const jour = String(ligne.dateJour).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour)) return null;

  const date = new Date(
    `${jour}T${deuxChiffres(heure.h)}:${deuxChiffres(heure.m)}:${deuxChiffres(heure.s)}`,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function deuxChiffres(valeur: number): string {
  return String(valeur).padStart(2, '0');
}

function lireHeure(brut: FilleAttenteVM['heureJour']): { h: number; m: number; s: number } | null {
  if (brut == null) return null;

  if (typeof brut === 'string') {
    const [h, m, s] = brut.split(':');
    const heures = Number(h);
    if (Number.isNaN(heures)) return null;
    return { h: heures, m: Number(m) || 0, s: Math.trunc(Number(s) || 0) };
  }

  if (Array.isArray(brut)) {
    return { h: Number(brut[0]) || 0, m: Number(brut[1]) || 0, s: Number(brut[2]) || 0 };
  }

  const objet = brut as ILocalDataTime;
  if (typeof objet.hour !== 'number') return null;
  return { h: objet.hour, m: objet.minute ?? 0, s: objet.second ?? 0 };
}

/** Heure d'entrée lisible : « 14:32 ». */
export function heureLisible(entree: Date | null): string {
  if (!entree) return '—';
  return `${deuxChiffres(entree.getHours())}:${deuxChiffres(entree.getMinutes())}`;
}

/**
 * Durée d'attente lisible : « depuis 8 min », « depuis 2 h 05 ».
 *
 * <p>Une horloge de poste en avance sur le serveur produirait une durée
 * négative : on l'affiche alors comme « à l'instant » plutôt que d'écrire une
 * absurdité.</p>
 */
export function attenteLisible(entree: Date | null, maintenant: number): string {
  if (!entree) return 'entrée inconnue';

  const secondes = Math.floor((maintenant - entree.getTime()) / 1000);
  if (secondes < 60) return "depuis moins d'une minute";

  const minutes = Math.floor(secondes / 60);
  if (minutes < 60) return `depuis ${minutes} min`;

  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  if (heures < 24) return `depuis ${heures} h ${deuxChiffres(reste)}`;

  const jours = Math.floor(heures / 24);
  return `depuis ${jours} j`;
}

/** Accord des libellés de comptage sans passer par une lib d'i18n. */
export function pluriel(nombre: number, singulier: string, plurielMot?: string): string {
  return nombre > 1 ? (plurielMot ?? `${singulier}s`) : singulier;
}
