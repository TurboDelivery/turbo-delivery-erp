/**
 * Lire les valeurs d'une cellule de tableur : dates et montants.
 *
 * <h3>Pourquoi ce module est partagé</h3>
 * <p>Ces lecteurs sont nés dans l'import de la base clients. Ils ne savent rien d'un
 * contact : ils savent qu'un tableur français écrit « 12.500 » pour douze mille cinq
 * cents et « 03/04/2026 » pour le 3 avril. L'import de TICKETS lit les mêmes cellules,
 * et chacun de ces pièges y coûterait la même chose — un montant divisé par mille, des
 * milliers de lignes décalées de plusieurs mois. Les recopier aurait garanti qu'un des
 * deux exemplaires finisse par diverger, alors ils sont remontés ici et leurs anciens
 * fichiers les réexportent.</p>
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

/**
 * Le montant tel qu'un tableur l'écrit, rendu en nombre.
 *
 * <p>⚠ Les espaces de groupement d'Excel ne sont pas des espaces ordinaires : c'est
 * U+00A0 (insécable) ou U+202F (fine insécable). Ce projet a déjà payé cette confusion,
 * sur les PDF, où `toLocaleString('fr-FR')` imprimait « 20/000 ». Les retirer par
 * `replace(/ /g,'')` n'en enlèverait aucun.</p>
 *
 * <p>La virgule décimale française est acceptée. Un texte qui ne contient aucun chiffre
 * rend `null` et non zéro : zéro est un montant, l'absence n'en est pas un.</p>
 */
export function analyserMontant(texte: string | null | undefined): number | null {
  if (texte === null || texte === undefined) return null;

  const sansEspaces = String(texte).replace(/[\s\u00A0\u202F\u2009]/g, '');

  // Le signe se lit AVANT d'etre retire. Un montant negatif n'est pas un ticket, c'est
  // une faute de frappe ; le depouiller de son signe rendrait 500 la ou l'agent a tape
  // -500, ce qui est pire que de refuser.
  if (/^-/.test(sansEspaces)) return null;

  const chiffresEtSeparateurs = sansEspaces.replace(/[^\d,.]/g, '');
  if (chiffresEtSeparateurs === '' || !/\d/.test(chiffresEtSeparateurs)) return null;

  /*
   * QUEL SEPARATEUR EST LA DECIMALE : CELA SE DECIDE PAR LA POSITION.
   *
   * Un tableur francais ecrit « 12.500 » pour douze mille cinq cents : le point groupe
   * les milliers, et le lire comme une decimale enregistrait 12,5, un ticket divise par
   * mille. Mais SheetJS, appele avec `raw: false`, rend une cellule au format Nombre a
   * deux decimales — ce qu'Excel pose des qu'on clique le bouton decimales — sous la
   * forme « 1500.50 », voire « 1,500.50 ». Retirer tous les points sans regarder rendait
   * alors 150 050 : le montant MULTIPLIE par cent, en silence, sur le panier du client,
   * que rien ne recoupe cote serveur (le montant de LIVRAISON, lui, doit egaler le prix
   * de la zone, ce qui le protege).
   *
   * La regle, en trois cas :
   *  - les deux signes presents : le DERNIER est la decimale, l'autre groupe. Couvre
   *    « 1,500.50 » comme « 1.500,50 » sans savoir dans quelle langue le fichier est ecrit.
   *  - des virgules seules : comportement d'origine INCHANGE, la virgule est decimale et
   *    deux virgules ne sont pas un nombre. Ne pas y toucher : « 1,500 » reste 1,5, ce que
   *    l'import BDD Clients lit ainsi depuis le premier jour.
   *  - des points seuls : groupement si le dernier est suivi d'exactement trois chiffres,
   *    decimale sinon. C'est ce seul cas que le defaut rendait faux.
   */
  const dernierPoint = chiffresEtSeparateurs.lastIndexOf('.');
  const derniereVirgule = chiffresEtSeparateurs.lastIndexOf(',');

  /** Partie entiere et decimales recollees avec la virgule, seule decimale en sortie. */
  const couperEn = (position: number): string | null => {
    const entier = chiffresEtSeparateurs.slice(0, position).replace(/[.,]/g, '');
    const decimales = chiffresEtSeparateurs.slice(position + 1);
    if (/[.,]/.test(decimales)) return null;
    return decimales === '' ? entier : `${entier},${decimales}`;
  };

  let sansMilliers: string | null;
  if (dernierPoint !== -1 && derniereVirgule !== -1) {
    sansMilliers = couperEn(Math.max(dernierPoint, derniereVirgule));
  } else if (derniereVirgule !== -1) {
    sansMilliers = chiffresEtSeparateurs;
  } else if (dernierPoint !== -1) {
    const apresLePoint = chiffresEtSeparateurs.length - dernierPoint - 1;
    sansMilliers = apresLePoint === 3
      ? chiffresEtSeparateurs.replace(/\./g, '')
      : couperEn(dernierPoint);
  } else {
    sansMilliers = chiffresEtSeparateurs;
  }
  if (sansMilliers === null) return null;

  // Deux virgules ne sont pas un nombre : on rend null plutot qu'un resultat invente.
  if ((sansMilliers.match(/,/g) ?? []).length > 1) return null;

  const valeur = Number(sansMilliers.replace(',', '.'));
  // Un montant negatif n'est pas un ticket, c'est une faute de frappe.
  return Number.isFinite(valeur) && valeur >= 0 ? valeur : null;
}
