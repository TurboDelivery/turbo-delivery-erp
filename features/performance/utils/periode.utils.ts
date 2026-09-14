import { lundiDeLaSemaineEnCours } from '@/features/performance/utils/semaine-iso.utils';

/**
 * Les quatre granularités de période de l'exigence 2.3 du cahier des charges « Performance
 * de la Flotte » : créneau, plage libre, mois, année.
 *
 * <h3>Pourquoi tout passe par l'URL</h3>
 * <p>La période choisie s'écrit dans la barre d'adresse. Elle survit au rechargement, se
 * partage par copier-coller, se retrouve dans l'historique du navigateur, et surtout elle
 * est lisible par les pages, qui sont des composants SERVEUR : sans paramètre d'URL, elles
 * n'auraient aucun moyen de savoir quoi demander.</p>
 *
 * <h3>Rien ici ne fait confiance à ce qu'il lit</h3>
 * <p>Ces valeurs viennent d'une barre d'adresse : n'importe qui peut les écrire, et un lien
 * ancien peut porter une valeur qui n'a plus de sens. Chaque forme est donc validée par une
 * expression STRICTE, et une valeur non conforme est ignorée plutôt que transmise. Le même
 * défaut a déjà coûté un écran d'erreur sur `?semaine` : `new Date('2026-9-7')` — un lundi
 * écrit sans zéro — rendait `NaN`, qui n'est pas `null`, franchissait la garde et faisait
 * répondre 400 au serveur.</p>
 */
export type ModePeriode = 'SEMAINE' | 'MOIS' | 'ANNEE' | 'PLAGE';

export interface PeriodeLue {
  mode: ModePeriode;
  /** Le lundi de la semaine lue. Renseigné dans TOUS les modes : le bandeau de paie en a besoin. */
  lundi: string;
  /** Bornes envoyées au serveur. Nulles en mode semaine, où c'est le couple (année, semaine) qui part. */
  debut: string | null;
  fin: string | null;
  /** Ce que l'écran affiche comme période. */
  libelle: string;
  /** Vrai quand la période tient dans une seule semaine : la note et le créneau restent lisibles. */
  estUneSemaine: boolean;
}

export interface ParametresPeriode {
  semaine?: string;
  mois?: string;
  annee?: string;
  debut?: string;
  fin?: string;
}

const JOUR = /^\d{4}-\d{2}-\d{2}$/;
const MOIS = /^\d{4}-\d{2}$/;
const ANNEE = /^\d{4}$/;

/** Les bornes d'années acceptées. Hors de là, c'est une URL forgée ou une faute de frappe. */
const ANNEE_MIN = 2020;
const ANNEE_MAX = 2100;

export const MOIS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** Une date d'URL, ou `null` si ce n'en est pas une. */
function jourValide(valeur?: string): string | null {
  if (!valeur || !JOUR.test(valeur)) return null;
  const d = new Date(`${valeur}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  // `new Date('2026-02-31')` ne lève pas, il glisse au 3 mars. On vérifie l'aller-retour.
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const jour = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mois}-${jour}` === valeur ? valeur : null;
}

/** Le lundi de la semaine qui contient une date, au format `AAAA-MM-JJ`. */
export function lundiDe(jour: string): string {
  const d = new Date(`${jour}T00:00:00`);
  const jourIso = d.getDay() || 7;
  d.setDate(d.getDate() - (jourIso - 1));
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const jourDuMois = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mois}-${jourDuMois}`;
}

/** Le dernier jour d'un mois, au format `AAAA-MM-JJ`. Le jour 0 du mois suivant est ce jour-là. */
function dernierJourDuMois(annee: number, mois: number): string {
  const d = new Date(annee, mois, 0);
  return `${annee}-${String(mois).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Un jour au format français, pour l'affichage. */
export function jourCourt(iso: string): string {
  const [a, m, j] = iso.split('-');
  return `${j}/${m}/${a}`;
}

/**
 * La période demandée, dans l'ordre de PRÉCISION.
 *
 * <p>Une plage explicite l'emporte sur un mois, qui l'emporte sur une année, qui l'emporte
 * sur une semaine. Sans rien, c'est la semaine en cours — le défaut du serveur, et donc ce
 * qu'une adresse sans paramètre doit continuer de montrer.</p>
 *
 * <p>⚠ Cet ordre est le MÊME que celui du serveur (`PeriodeLectureRecord.resoudre`). Deux
 * ordres différents donneraient un écran qui affiche un libellé et des chiffres qui ne s'y
 * rapportent pas.</p>
 */
export function lirePeriode(p: ParametresPeriode): PeriodeLue {
  const debut = jourValide(p.debut);
  const fin = jourValide(p.fin);

  // 1. Plage libre : les deux bornes, dans le bon ordre.
  if (debut && fin && debut <= fin) {
    return {
      mode: 'PLAGE',
      lundi: lundiDe(debut),
      debut,
      fin,
      libelle: `Du ${jourCourt(debut)} au ${jourCourt(fin)}`,
      estUneSemaine: false,
    };
  }

  // 2. Mois calendaire.
  if (p.mois && MOIS.test(p.mois)) {
    const annee = Number(p.mois.slice(0, 4));
    const mois = Number(p.mois.slice(5, 7));
    if (annee >= ANNEE_MIN && annee <= ANNEE_MAX && mois >= 1 && mois <= 12) {
      const premier = `${p.mois}-01`;
      return {
        mode: 'MOIS',
        lundi: lundiDe(premier),
        debut: premier,
        fin: dernierJourDuMois(annee, mois),
        libelle: `${MOIS_FR[mois - 1]} ${annee}`,
        estUneSemaine: false,
      };
    }
  }

  // 3. Année civile.
  if (p.annee && ANNEE.test(p.annee)) {
    const annee = Number(p.annee);
    if (annee >= ANNEE_MIN && annee <= ANNEE_MAX) {
      return {
        mode: 'ANNEE',
        lundi: lundiDe(`${annee}-01-01`),
        debut: `${annee}-01-01`,
        fin: `${annee}-12-31`,
        libelle: `Année ${annee}`,
        estUneSemaine: false,
      };
    }
  }

  // 4. Semaine, le défaut.
  const lundi = jourValide(p.semaine) ?? lundiDeLaSemaineEnCours();
  return {
    mode: 'SEMAINE',
    lundi,
    debut: null,
    fin: null,
    libelle: `Semaine du ${jourCourt(lundi)}`,
    estUneSemaine: true,
  };
}

/**
 * Les lundis des semaines couvertes par une période, dans l'ordre.
 *
 * <p>Une fiche de paie couvre UNE semaine : c'est un créneau, avec son verrouillage et ses
 * tickets validés. Sur un mois il y en a quatre ou cinq. Plutôt que d'additionner des lignes
 * de paie — ce qui donnerait un taux moyen qui n'a été appliqué à rien, et une éligibilité à
 * la prime qui ne vaudrait pour aucune semaine — la fiche propose de parcourir ces semaines
 * une par une.</p>
 *
 * <p>La liste est plafonnée : au-delà, ce n'est plus une navigation, c'est un mur de liens.</p>
 */
export function lundisDeLaPeriode(periode: PeriodeLue, maximum = 14): string[] {
  if (periode.estUneSemaine || !periode.debut || !periode.fin) {
    return [periode.lundi];
  }

  const lundis: string[] = [];
  let courant = lundiDe(periode.debut);
  const borne = periode.fin;

  while (courant <= borne && lundis.length < maximum) {
    lundis.push(courant);
    const d = new Date(`${courant}T00:00:00`);
    d.setDate(d.getDate() + 7);
    const mois = String(d.getMonth() + 1).padStart(2, '0');
    const jour = String(d.getDate()).padStart(2, '0');
    courant = `${d.getFullYear()}-${mois}-${jour}`;
  }

  return lundis;
}

/** L'URL d'une période, telle qu'elle doit être recopiée dans un lien. */
export function requetePeriode(
  parametres: ParametresPeriode,
  remplacements: ParametresPeriode = {},
): string {
  const query = new URLSearchParams();
  for (const [cle, valeur] of Object.entries({ ...parametres, ...remplacements })) {
    if (valeur) query.set(cle, valeur);
  }
  const requete = query.toString();
  return requete ? `?${requete}` : '';
}
