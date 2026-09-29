/**
 * Lire la date d'une commande telle qu'un fichier de caisse l'écrit.
 *
 * <h3>Pourquoi cette fonction existe</h3>
 * <p>Le serveur attend un instant ISO. Une caisse écrit `28/09/2026 15:41`. L'écran
 * envoyait la cellule telle quelle, et le serveur répondait
 * `Text '28/09/2026 15:41' could not be parsed at index 0` : un message d'exception Java
 * sur un import de treize mille lignes, après tout le travail de colonnes, et pour une
 * donnée qui n'est même pas obligatoire.</p>
 *
 * <h3>⚠ Le jour vient AVANT le mois</h3>
 * <p>`03/04/2026` est le 3 avril, pas le 4 mars. C'est la convention d'ici, et celle que
 * produisent les caisses du réseau. Se tromper d'axe ne casse rien : cela décale
 * silencieusement des milliers de commandes de quelques mois, et plus personne ne peut
 * le voir après coup. La forme ISO `2026-04-03` reste reconnue en premier, parce qu'elle
 * n'est jamais ambiguë.</p>
 *
 * <h3>⚠ L'heure est gardée, et lue en UTC</h3>
 * <p>Abidjan est à UTC+0 toute l'année : une heure locale EST l'heure UTC, sans
 * conversion et sans heure d'été. Poser un autre fuseau décalerait chaque commande, et
 * ferait basculer de jour toutes celles du soir.</p>
 */

/** Ce que rend la lecture : l'instant ISO, ou rien si la cellule n'est pas une date. */
export type DateLue = string | null;

const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/;
/*
 * ⚠ `\d{4}` passe AVANT `\d{2}` dans l'alternative, et la coupure `(?!\d)` la ferme.
 *
 * Une alternative de RegExp est ordonnée : écrite `(\d{2}|\d{4})`, elle prenait « 20 »
 * dans « 2026 », laissait « 26 15:41 » derrière elle, et rendait le 28 septembre 2020
 * à minuit. La forme était valide, la date fausse de six ans, et rien ne le disait.
 */
const JOUR_MOIS = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})(?!\d)(?:[T ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/;

/** Deux chiffres d'année : 26 est 2026, jamais 1926. Une caisse n'exporte pas le passé. */
function annee(brut: string): number {
  const n = Number(brut);
  return brut.length === 2 ? 2000 + n : n;
}

/**
 * Le calendrier a le dernier mot.
 *
 * <p>`31/02/2026` a une forme valide et n'existe pas. Sans ce contrôle, `Date.UTC` le
 * reporte au 3 mars sans rien dire, et la commande change de mois.</p>
 */
function instantSiReel(
  an: number,
  mois: number,
  jour: number,
  heure: number,
  minute: number,
  seconde: number,
): DateLue {
  if (mois < 1 || mois > 12 || jour < 1 || jour > 31) return null;
  if (heure > 23 || minute > 59 || seconde > 59) return null;
  if (an < 2000 || an > 2100) return null;
  const t = Date.UTC(an, mois - 1, jour, heure, minute, seconde);
  const d = new Date(t);
  if (d.getUTCFullYear() !== an || d.getUTCMonth() !== mois - 1 || d.getUTCDate() !== jour) {
    return null;
  }
  return d.toISOString();
}

/**
 * Rend l'instant ISO d'une cellule de date, ou `null` si elle n'en est pas une.
 *
 * <p>`null` n'est pas un échec de la ligne : la date enrichit la fiche, elle ne
 * l'identifie pas. L'écran compte les cellules illisibles et le dit, plutôt que de
 * refuser des clients pour une colonne facultative.</p>
 */
export function lireDateFichier(brut: string | null | undefined): DateLue {
  const texte = (brut ?? '').trim();
  if (texte === '') return null;

  const iso = ISO.exec(texte);
  if (iso) {
    return instantSiReel(
      Number(iso[1]),
      Number(iso[2]),
      Number(iso[3]),
      Number(iso[4] ?? 0),
      Number(iso[5] ?? 0),
      Number(iso[6] ?? 0),
    );
  }

  const fr = JOUR_MOIS.exec(texte);
  if (fr) {
    return instantSiReel(
      annee(fr[3]),
      Number(fr[2]),
      Number(fr[1]),
      Number(fr[4] ?? 0),
      Number(fr[5] ?? 0),
      Number(fr[6] ?? 0),
    );
  }

  return null;
}

/** Combien de cellules non vides n'ont pas pu être lues comme une date. */
export function compterDatesIllisibles(cellules: (string | null | undefined)[]): number {
  return cellules.filter((c) => (c ?? '').trim() !== '' && lireDateFichier(c) === null).length;
}
