'use client';

import { ProgressBar, Label } from '@/components/heroui';

import CarteStat, { type TonStat } from '@/components/commons/CarteStat';

interface CreneauStatCardProps {
  label: string;
  sublabel?: string;
  value: number;
  color?: 'success' | 'accent' | 'warning' | 'danger';
}

const TON: Record<NonNullable<CreneauStatCardProps['color']>, TonStat> = {
  success: 'succes',
  accent: 'primaire',
  warning: 'attention',
  danger: 'danger',
};

/**
 * Carte de taux d'un creneau, avec sa barre de progression.
 *
 * <p>Enveloppe `CarteStat` en conservant sa signature. C'est le SEUL usage de
 * l'echappatoire `children` du composant partage : la barre de progression n'existe que
 * sur cette carte. Si un deuxieme appelant se met a utiliser `children`, c'est le signal
 * qu'il faut une vraie prop.</p>
 */
export function CreneauStatCard({ label, sublabel, value, color = 'accent' }: CreneauStatCardProps) {
  return (
    <CarteStat libelle={label} valeur={`${value}%`} note={sublabel} ton={TON[color]}>
      <ProgressBar size="md" value={value} color={color} aria- className="mt-3"><Label>{label}</Label><ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track></ProgressBar>
    </CarteStat>
  );
}
