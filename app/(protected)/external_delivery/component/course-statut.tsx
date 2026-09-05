'use client';

import { Chip } from '@heroui-v3/react';

/**
 * Vocabulaire unique des statuts d'une course externe (canal intégration).
 * Backend : EN_ATTENTE → VALIDER (livreur assigné) → EN_COURS → TERMINER ; ANNULER.
 */
export const COURSE_STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  EN_PREPARATION: 'En préparation',
  VALIDER: 'Assignée',
  EN_COURS: 'En livraison',
  TERMINER: 'Terminée',
  ANNULER: 'Annulée',
};

/**
 * Le ton d'un statut de course.
 *
 * <h3>Six teintes deviennent trois</h3>
 * <p>La chaîne compte cinq états d'acheminement plus l'annulation, et chacun portait sa
 * couleur : ambre, violet, bleu, violet encore, vert, rouge. « En attente », « En
 * préparation », « Assignée », « En livraison » sont les états NORMAUX d'une course qui
 * avance — les peindre revenait à colorer toute la colonne, et l'ambre y annonçait un
 * problème qui n'existe pas.</p>
 *
 * <p>Ce qui se distingue, c'est ce qui est FINI (terminée) et ce qui est DÉFAIT (annulée).
 * Le geste attendu sur une course en attente est dit par son bouton, pas par sa pastille.
 * Les six libellés restent.</p>
 */
export const COURSE_STATUT_COLORS: Record<string, 'danger' | 'default' | 'success'> = {
  ANNULER: 'danger',
  EN_ATTENTE: 'default',
  EN_COURS: 'default',
  EN_PREPARATION: 'default',
  TERMINER: 'success',
  VALIDER: 'default',
};

/**
 * Bordure gauche d'accent des cartes de la liste, par statut.
 *
 * <p>C'étaient six teintes de la palette Tailwind — `amber-400`, `purple-400`, `blue-500`,
 * `purple-500`, `green-500`, `red-400` — sans variante sombre. Le liseré ne distingue plus
 * que ce qui est fini de ce qui est défait ; le reste suit son cours.</p>
 */
export const COURSE_STATUT_ACCENTS: Record<string, string> = {
  ANNULER: 'border-l-danger',
  EN_ATTENTE: 'border-l-separator',
  EN_COURS: 'border-l-separator',
  EN_PREPARATION: 'border-l-separator',
  TERMINER: 'border-l-success',
  VALIDER: 'border-l-separator',
};

export function courseStatutLabel(statut?: string | null): string {
  if (!statut) return '—';
  return COURSE_STATUT_LABELS[statut.toUpperCase()] ?? statut;
}

export function CourseStatutChip({ statut, size = 'sm' }: { statut?: string | null; size?: 'sm' | 'md' }) {
  const key = (statut ?? '').toUpperCase();
  return (
    <Chip color={COURSE_STATUT_COLORS[key] ?? 'default'} size={size} variant="soft">
      <Chip.Label className="whitespace-nowrap">{courseStatutLabel(statut)}</Chip.Label>
    </Chip>
  );
}

/** Statuts des commandes individuelles d'une course. */
export const COMMANDE_STATUT_LABELS: Record<string, string> = {
  EN_PREPARATION: 'En préparation',
  EN_ATTENTE_RECUPERATION: 'À récupérer',
  RECUPERER: 'Récupérée',
  EN_COURS_LIVRAISON: 'En livraison',
  EN_ATTENTE_VERSEMENT: 'Attente versement',
  TERMINER: 'Terminée',
  ANNULER: 'Annulée',
};

/**
 * Même raisonnement pour les commandes d'une course : reste ce qui est fini, défait, et
 * ce qui attend un VERSEMENT — c'est de l'argent qui n'est pas encore remonté.
 */
export const COMMANDE_STATUT_COLORS: Record<string, 'danger' | 'default' | 'success' | 'warning'> = {
  ANNULER: 'danger',
  EN_ATTENTE_RECUPERATION: 'default',
  EN_ATTENTE_VERSEMENT: 'warning',
  EN_COURS_LIVRAISON: 'default',
  EN_PREPARATION: 'default',
  RECUPERER: 'default',
  TERMINER: 'success',
};

export function CommandeStatutChip({ statut }: { statut?: string | null }) {
  const key = (statut ?? '').toUpperCase();
  return (
    <Chip color={COMMANDE_STATUT_COLORS[key] ?? 'default'} size="sm" variant="soft">
      <Chip.Label className="whitespace-nowrap">
        {COMMANDE_STATUT_LABELS[key] ?? statut ?? '—'}
      </Chip.Label>
    </Chip>
  );
}

/** Montant total d'une course = Σ prix + Σ frais de livraison. */
export function montantCourse(commandes?: { prix?: number | null; fraisLivraison?: number | null }[] | null): number {
  return (commandes ?? []).reduce((sum, c) => sum + (c.prix ?? 0) + (c.fraisLivraison ?? 0), 0);
}

export const fmtXof = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(v);
