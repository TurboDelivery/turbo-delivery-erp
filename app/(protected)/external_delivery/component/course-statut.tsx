'use client';

import { Chip } from '@heroui/react';

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

export const COURSE_STATUT_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
  EN_ATTENTE: 'warning',
  EN_PREPARATION: 'secondary',
  VALIDER: 'primary',
  EN_COURS: 'secondary',
  TERMINER: 'success',
  ANNULER: 'danger',
};

/** Bordure gauche d'accent des cartes de la liste, par statut. */
export const COURSE_STATUT_ACCENTS: Record<string, string> = {
  EN_ATTENTE: 'border-l-amber-400',
  EN_PREPARATION: 'border-l-purple-400',
  VALIDER: 'border-l-blue-500',
  EN_COURS: 'border-l-purple-500',
  TERMINER: 'border-l-green-500',
  ANNULER: 'border-l-red-400',
};

export function courseStatutLabel(statut?: string | null): string {
  if (!statut) return '—';
  return COURSE_STATUT_LABELS[statut.toUpperCase()] ?? statut;
}

export function CourseStatutChip({ statut, size = 'sm' }: { statut?: string | null; size?: 'sm' | 'md' }) {
  const key = (statut ?? '').toUpperCase();
  return (
    <Chip color={COURSE_STATUT_COLORS[key] ?? 'default'} size={size} variant="flat">
      {courseStatutLabel(statut)}
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

export const COMMANDE_STATUT_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
  EN_PREPARATION: 'secondary',
  EN_ATTENTE_RECUPERATION: 'warning',
  RECUPERER: 'primary',
  EN_COURS_LIVRAISON: 'secondary',
  EN_ATTENTE_VERSEMENT: 'warning',
  TERMINER: 'success',
  ANNULER: 'danger',
};

export function CommandeStatutChip({ statut }: { statut?: string | null }) {
  const key = (statut ?? '').toUpperCase();
  return (
    <Chip color={COMMANDE_STATUT_COLORS[key] ?? 'default'} size="sm" variant="flat">
      {COMMANDE_STATUT_LABELS[key] ?? statut ?? '—'}
    </Chip>
  );
}

/** Montant total d'une course = Σ prix + Σ frais de livraison. */
export function montantCourse(commandes?: { prix?: number | null; fraisLivraison?: number | null }[] | null): number {
  return (commandes ?? []).reduce((sum, c) => sum + (c.prix ?? 0) + (c.fraisLivraison ?? 0), 0);
}

export const fmtXof = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(v);
