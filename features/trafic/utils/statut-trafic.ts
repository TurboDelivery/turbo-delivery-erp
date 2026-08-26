import type { TonStat } from '@/components/commons/CarteStat';
import type { StatutTrafic } from '@/features/trafic/types/trafic.type';

/**
 * Vocabulaire unique de l'écran TRAFIC.
 *
 * Chaque statut porte SA définition en une ligne. C'est la correction de fond
 * de la refonte : avant, l'écran affichait « Disponible » sans que personne ne
 * sache si cela voulait dire « a coché une case », « a émis une position » ou
 * « va vraiment recevoir la prochaine course ». La réponse est désormais
 * écrite à côté du chiffre.
 */
export interface StatutTraficMeta {
  /** Libellé pluriel, tel qu'affiché sur les compteurs de tête. */
  libelle: string;
  /** Libellé singulier, pour la pastille d'un livreur. */
  libelleCourt: string;
  /** La définition — affichée sous le compteur, pas dans une infobulle. */
  explication: string;
  /**
   * Ton des compteurs de tete, en jetons HeroUI.
   *
   * Il double `couleur`/`fond` a dessein, il ne les remplace pas : la legende
   * de la carte et les pastilles de la liste peignent en style inline, ce qui
   * exige un hexadecimal. Seul le ton survit au retour du mode sombre sans
   * retouche, donc tout ce qui peut passer par lui doit passer par lui.
   */
  ton: TonStat;
  /** Couleur de référence (pastilles, points, pins). */
  couleur: string;
  /** Fond de la pastille d'état (couleur/12 du langage de design). */
  fond: string;
}

export const VERT_DISPONIBLE = '#1AA05A';

export const STATUT_TRAFIC_META: Record<StatutTrafic, StatutTraficMeta> = {
  DISPONIBLE: {
    libelle: 'Disponibles',
    libelleCourt: 'Disponible',
    explication: 'Ont pointé, sont en file, peuvent recevoir une course',
    ton: 'succes',
    couleur: VERT_DISPONIBLE,
    fond: 'rgba(26, 160, 90, 0.12)',
  },
  EN_COURSE: {
    libelle: 'En course',
    libelleCourt: 'En course',
    explication: 'Une livraison est en cours de réalisation',
    ton: 'attention',
    couleur: '#D97706',
    fond: 'rgba(217, 119, 6, 0.12)',
  },
  EN_PAUSE: {
    libelle: 'En pause',
    libelleCourt: 'En pause',
    explication: 'Ont pris leur service puis se sont retirés de la file',
    ton: 'neutre',
    couleur: '#6B7280',
    fond: 'rgba(107, 114, 128, 0.12)',
  },
  HORS_SERVICE: {
    libelle: 'Hors service',
    libelleCourt: 'Hors service',
    explication: "Pas de créneau aujourd'hui, ou montée jamais pointée",
    // Le seul ton qui ne traduit PAS la couleur d'origine (#9CA3AF, gris) : il a
    // ete impose pour distinguer les deux statuts gris du bandeau, EN_PAUSE et
    // HORS_SERVICE, qui se confondaient une fois passes au meme jeton neutre.
    ton: 'danger',
    couleur: '#9CA3AF',
    fond: 'rgba(156, 163, 175, 0.14)',
  },
};

/** Ordre d'affichage : du plus actionnable au moins actionnable. */
export const STATUTS_ORDONNES: StatutTrafic[] = [
  'DISPONIBLE',
  'EN_COURSE',
  'EN_PAUSE',
  'HORS_SERVICE',
];

/** Distance lisible par un opérateur : « 420 m », « 1,8 km ». */
export function formaterDistance(metres?: number | null): string | null {
  if (metres == null || Number.isNaN(metres)) return null;
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1).replace('.', ',')} km`;
}

/** Ancienneté du dernier point GPS : « il y a 12 min ». */
export function tempsEcoule(iso?: string | null): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 60) return `il y a ${sec} s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}
