import {
  COMPLEMENT_VIDE,
  type IProgramme,
  type IPreuveCarburant,
  type ISurplus,
} from '@/features/turboys/types/programme.types';

/**
 * L'ÉTAT DES PREUVES WAVE D'UN JOUR (RG-W02).
 *
 * <p>Vert si toutes les preuves du jour sont reçues, orange si une partie seulement,
 * gris si aucune. « 1/2 » quand le jour a un surplus : deux versements, deux captures.</p>
 *
 * <p>Ce calcul vit ici, pur et testé, parce qu'il décide d'une COULEUR sur trente-huit
 * lignes — un vert mis à tort sur un jour non prouvé passe inaperçu, et la comptabilité
 * découvre le trou en fin de mois.</p>
 */

export type EtatPreuves = 'AUCUNE' | 'PARTIELLE' | 'COMPLETE' | 'SANS_OBJET';

export interface PreuvesDuJour {
  etat: EtatPreuves;
  /** Nombre de versements prouvés sur le nombre attendu. */
  recues: number;
  attendues: number;
  /** Combien sont allées jusqu'à la validation comptable. */
  validees: number;
}

/** Les surplus vivants d'un jour. Un surplus annulé n'attend aucune preuve. */
function surplusVivants(p: IProgramme, jour: string): ISurplus[] {
  const c = p.complement ?? COMPLEMENT_VIDE;
  return (c.surplusParJour?.[jour] ?? []).filter((s) => !s.annule);
}

/** Les preuves d'un jour, rejetées EXCLUES : une capture refusée ne prouve rien. */
function preuvesVivantes(p: IProgramme, jour: string): IPreuveCarburant[] {
  const c = p.complement ?? COMPLEMENT_VIDE;
  return (c.preuvesParJour?.[jour] ?? []).filter((x) => x.statut !== 'REJETEE');
}

/**
 * L'état des preuves d'un jour.
 *
 * <p>`SANS_OBJET` quand rien n'est attendu : jour de repos, ou jour sans dotation ni
 * surplus. Un jour sans argent versé ne doit pas afficher un œil gris, qui se lirait
 * comme une preuve manquante.</p>
 */
export function preuvesDuJour(p: IProgramme, jour: string): PreuvesDuJour {
  const j = (p.jours ?? []).find((x) => x.jour === jour);
  if (!j || !j.actif) {
    return { attendues: 0, etat: 'SANS_OBJET', recues: 0, validees: 0 };
  }

  const surplus = surplusVivants(p, jour);
  const dotation = (j.montantCarburant ?? 0) > 0;
  const attendues = (dotation ? 1 : 0) + surplus.length;
  if (attendues === 0) {
    return { attendues: 0, etat: 'SANS_OBJET', recues: 0, validees: 0 };
  }

  const vivantes = preuvesVivantes(p, jour);
  /*
   * Comptage par VERSEMENT, pas par ligne. Après un rejet suivi d'un nouveau dépôt, le
   * jour porte deux captures pour un seul versement : les compter toutes deux ferait un
   * « 2/1 » qui n'a pas de sens, et pire, pourrait faire passer un jour pour complet.
   */
  const prouves = new Set<string>();
  const valides = new Set<string>();
  for (const x of vivantes) {
    const cle = x.surplusId ?? 'DOTATION';
    if (cle === 'DOTATION' && !dotation) continue;
    if (cle !== 'DOTATION' && !surplus.some((s) => s.id === cle)) continue;
    prouves.add(cle);
    if (x.statut === 'VALIDEE') valides.add(cle);
  }

  const recues = prouves.size;
  return {
    attendues,
    etat: recues === 0 ? 'AUCUNE' : recues >= attendues ? 'COMPLETE' : 'PARTIELLE',
    recues,
    validees: valides.size,
  };
}

/**
 * Les preuves manquantes d'un programme, sur les jours DÉJÀ PASSÉS.
 *
 * <p>⚠ Seul un programme PARTI chez le livreur (notifié ou accepté) doit une preuve : c'est
 * la règle du serveur (`RelancePreuvesService`), qui ne relance que ceux-là. Sans elle, un
 * brouillon resté en plan sur une semaine passée affichait « 6 preuves manquantes » pour de
 * l'argent qui n'a jamais été versé, et l'onglet annonçait plus de retards que la relance
 * n'en trouvait.</p>
 */
export function preuvesManquantes(p: IProgramme, jours: readonly string[], aujourdhui = new Date()): number {
  if (p.statut !== 'NOTIFIE' && p.statut !== 'ACCEPTE') return 0;
  let n = 0;
  for (const jour of jours) {
    const j = (p.jours ?? []).find((x) => x.jour === jour);
    // L'argent de demain n'est pas encore versé : sa preuve n'est pas en retard.
    if (!j?.date || new Date(j.date) > aujourdhui) continue;
    const e = preuvesDuJour(p, jour);
    if (e.etat === 'SANS_OBJET') continue;
    n += e.attendues - e.recues;
  }
  return n;
}
