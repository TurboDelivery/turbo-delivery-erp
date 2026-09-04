/**
 * Vocabulaire visuel de la console STANDARD (incidents).
 *
 * Un seul principe : l'écran se lit par URGENCE, pas par date. Le rouge est
 * réservé à ce que personne n'a encore pris en charge, l'ambre à ce qui est en
 * main, le vert à ce qui est réglé, le gris à ce qui est clos. Les classes sont
 * écrites en toutes lettres (et non composées à la volée) pour que Tailwind les
 * génère bien.
 */

import { StatutIncident, StatutTraficLivreur } from '../types/standard.types';

export interface TonIncident {
  /** Pastille d'icône (fond teinté) + icône. */
  pastille: string;
  /** Pastille d'état : fond teinté, texte petit et gras. */
  etat: string;
  /** Point de couleur des titres de section. */
  point: string;
  /** Bordure de la carte : marquée pour ce qui attend, discrète sinon. */
  carte: string;
  /** Couleur de texte pleine (chiffres KPI). */
  texte: string;
}

export const TON_INCIDENT: Record<StatutIncident, TonIncident> = {
  RECU: {
    pastille: 'bg-danger/10 text-danger-soft-foreground',
    etat: 'bg-danger/10 text-danger-soft-foreground',
    point: 'bg-danger',
    carte: 'border-danger/30',
    texte: 'text-danger-soft-foreground',
  },
  EN_COURS: {
    pastille: 'bg-warning/10 text-warning-soft-foreground',
    etat: 'bg-warning/10 text-warning-soft-foreground',
    point: 'bg-warning',
    carte: 'border-warning/25',
    texte: 'text-warning-soft-foreground',
  },
  TRAITE: {
    pastille: 'bg-success/10 text-success-soft-foreground',
    etat: 'bg-success/10 text-success-soft-foreground',
    point: 'bg-success',
    carte: 'border-default-200/50',
    texte: 'text-success-soft-foreground',
  },
  CLOTURE: {
    pastille: 'bg-default-200/60 text-default-500',
    etat: 'bg-default-200/60 text-default-600',
    point: 'bg-default-400',
    carte: 'border-default-200/50',
    texte: 'text-default-500',
  },
};

/** Statut terrain du livreur : DISPONIBLE = présent dans la file du jour (pointage). */
export const TON_TRAFIC: Record<StatutTraficLivreur, string> = {
  EN_COURSE: 'bg-warning/10 text-warning-soft-foreground',
  DISPONIBLE: 'bg-success/10 text-success-soft-foreground',
  EN_PAUSE: 'bg-default-200/60 text-default-600',
  HORS_SERVICE: 'bg-default-200/60 text-default-500',
};

/** Horodatage court : « 14:03 » aujourd'hui, « 12/07 14:03 » sinon. */
export function heureIncident(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (estAujourdhui(iso)) return heure;
  const jour = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  return `${jour} ${heure}`;
}

/** Date complète (infobulles, historique). */
export function dateIncident(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** L'incident a-t-il été signalé aujourd'hui (heure locale du poste) ? */
export function estAujourdhui(iso?: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return d.toDateString() === new Date().toDateString();
}

/** Ancienneté en minutes — sert à signaler un incident qui traîne. */
export function ancienneteMinutes(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
}

/** « il y a 4 min », « il y a 2 h 10 » — l'attente doit sauter aux yeux. */
export function attenteLisible(iso?: string | null): string {
  const min = ancienneteMinutes(iso);
  if (min == null) return '—';
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  const reste = min % 60;
  if (h < 24) return reste ? `il y a ${h} h ${String(reste).padStart(2, '0')}` : `il y a ${h} h`;
  const j = Math.floor(h / 24);
  return `il y a ${j} j`;
}

/** Un numéro utilisable dans un lien `tel:` (espaces et séparateurs retirés). */
export function lienTelephone(telephone?: string | null): string | null {
  const propre = (telephone ?? '').replace(/[^\d+]/g, '');
  return propre.length >= 6 ? `tel:${propre}` : null;
}
