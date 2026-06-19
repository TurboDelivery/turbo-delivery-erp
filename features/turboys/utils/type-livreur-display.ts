import type { TurboyType } from '@/features/turboys/types/turboys.types';

/**
 * V54 (2026-05-29) — Source unique de vérité pour l'affichage d'un
 * {@link TurboyType} dans l'UI (label, couleur HeroUI, couleur hex,
 * description). Cf. note de cadrage DGA du 28/05/2026.
 *
 * <p>Pourquoi un helper centralisé ? Avant cette fix, le mapping
 * type → label/couleur était dupliqué dans au moins 7 fichiers
 * ({@code men-columns}, {@code courier-card}, {@code export-pdf},
 * {@code turboy-table-columns}, {@code turboys-panel}, {@code MapLeaflet},
 * etc.) avec des ternaires à 2 branches du genre
 * {@code type === 'INDEPENDANT' ? 'Indépendant' : 'Journalier'}. Quand on
 * a introduit {@code SUPERVISEUR_LIVREUR}, ces 7 endroits ont retombé
 * silencieusement les superviseurs-livreurs dans la branche par défaut
 * "Journalier" — bug subtil signalé en prod le 29/05.</p>
 *
 * <p>Règle d'usage : <b>toute</b> nouvelle représentation UI d'un type
 * livreur doit passer par {@link #getTurboyTypeDisplay}. Aucun ternaire
 * binaire en dur dans les composants.</p>
 */
export type HeroUIChipColor = 'success' | 'warning' | 'secondary' | 'primary' | 'danger' | 'default';

export interface TurboyTypeDisplay {
  /** Libellé court à afficher dans les chips/badges. */
  label: string;
  /** Libellé pluriel pour les compteurs ("Indépendants", "Journaliers", etc.). */
  labelPlural: string;
  /** Couleur HeroUI pour les composants {@code Chip}/{@code Button}. */
  chipColor: HeroUIChipColor;
  /** Couleur hex pour les pins de carte ou exports PDF. */
  hexColor: string;
  /** Brève description du périmètre métier. */
  description: string;
}

const DISPLAY_BY_TYPE: Record<TurboyType, TurboyTypeDisplay> = {
  INDEPENDANT: {
    label: 'Indépendant',
    labelPlural: 'Indépendants',
    chipColor: 'success',
    hexColor: '#2563eb',
    description: 'Seul concerné par la paie hebdomadaire automatique.',
  },
  JOURNALIER: {
    label: 'Journalier',
    labelPlural: 'Journaliers',
    chipColor: 'secondary',
    hexColor: '#dc2626',
    description: 'Vérifié dans le créneau mais payé via un autre circuit.',
  },
  SUPERVISEUR_LIVREUR: {
    label: 'Superviseur-livreur',
    labelPlural: 'Superviseurs-livreurs',
    chipColor: 'warning',
    hexColor: '#9333ea',
    description: 'Superviseur effectuant aussi des livraisons. Exclu de la paie hebdo.',
  },
};

const FALLBACK_DISPLAY: TurboyTypeDisplay = {
  label: 'À catégoriser',
  labelPlural: 'À catégoriser',
  chipColor: 'default',
  hexColor: '#6b7280',
  description: 'Contrat non catégorisé — la RH doit qualifier ce profil.',
};

/**
 * Retourne la représentation UI complète d'un type de livreur. Robuste aux
 * valeurs inconnues (renvoie le {@link #FALLBACK_DISPLAY}) — n'écrit jamais
 * de label faux comme "Journalier" pour un type non reconnu.
 */
export function getTurboyTypeDisplay(type: string | null | undefined): TurboyTypeDisplay {
  if (!type) return FALLBACK_DISPLAY;
  return DISPLAY_BY_TYPE[type as TurboyType] ?? FALLBACK_DISPLAY;
}

/** Liste des 3 options pour les selects de saisie de type. Ordre métier. */
export const TURBOY_TYPE_OPTIONS: Array<{ value: TurboyType; label: string; description: string }> = [
  { value: 'INDEPENDANT', label: DISPLAY_BY_TYPE.INDEPENDANT.label, description: DISPLAY_BY_TYPE.INDEPENDANT.description },
  { value: 'JOURNALIER', label: DISPLAY_BY_TYPE.JOURNALIER.label, description: DISPLAY_BY_TYPE.JOURNALIER.description },
  { value: 'SUPERVISEUR_LIVREUR', label: DISPLAY_BY_TYPE.SUPERVISEUR_LIVREUR.label, description: DISPLAY_BY_TYPE.SUPERVISEUR_LIVREUR.description },
];

/** Options pour le filtre "Tous + 3 types" du tableau coursiers. */
export const TURBOY_FILTER_OPTIONS: Array<{ value: '' | TurboyType; label: string }> = [
  { value: '', label: 'Tous les types' },
  ...TURBOY_TYPE_OPTIONS.map(({ value, label }) => ({ value, label })),
];
