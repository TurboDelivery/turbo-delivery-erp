/**
 * Types partagés de l'écran « Demande de Turboys » (EF-02, EF-07) —
 * strictement alignés sur le contrat de l'API partenaire.
 */

export type Zone = {
  id: string;
  zone: string;
  nom: string;
  tarifFcfa: number;
  latitude: number | null;
  longitude: number | null;
};

export type StatutCourse =
  | 'EN_ATTENTE_AFFECTATION'
  | 'TURBOYS_AFFECTE'
  | 'EN_ROUTE_CLIENT'
  | 'LIVREE_RETOUR_EN_COURS'
  | 'CLOTURE_BLOQUEE'
  | 'TERMINEE'
  | 'ANNULEE';

export type LigneCourse = {
  courseId: string;
  code: string;
  creeLe: string;
  statut: StatutCourse;
  zone: string;
  tarifFcfa: number;
  montantCommandeFcfa: number | null;
  client: string | null;
  contact: string | null;
  turboys: string | null;
  localisation: 'PAS_DE_LIEN' | 'LIEN_ENVOYE' | 'POSITION_RECUE' | 'EXPIRE';
  clotureBloquee: boolean;
  donneesCompletes: boolean;
};

export type ReponseDemande = {
  courseId: string;
  reference: string;
  zone: string;
  tarifFcfa: number;
  lienLocalisation: string | null;
};

export type ParametresRush = {
  active: boolean;
  ouvertMaintenant: boolean;
  plagesHoraires: string | null;
  restreintAuxPlages: boolean;
  zonesFavorites: string | null;
  envoiSansClient: boolean;
  pinDefini: boolean;
};

export type ClientRecent = { nom: string; contact: string };

export const formaterFcfa = (montant: number): string =>
  new Intl.NumberFormat('fr-FR').format(montant);

export const chiffresSeuls = (texte: string): string => texte.replace(/\D/g, '');

/** Un JSON stocké en chaîne côté serveur ; null / invalide → valeur de repli. */
export function lireJson<T>(brut: string | null, repli: T): T {
  if (!brut) return repli;
  try {
    return JSON.parse(brut) as T;
  } catch {
    return repli;
  }
}
