'use client';

import { Progress } from '@/components/heroui';

import CarteStat, { type TonStat } from '@/components/commons/CarteStat';

interface CreneauStatCardProps {
  label: string;
  sublabel?: string;
  value: number;
  color?: 'success' | 'primary' | 'warning' | 'danger';
}

const TON: Record<NonNullable<CreneauStatCardProps['color']>, TonStat> = {
  success: 'succes',
  primary: 'primaire',
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
export function CreneauStatCard({ label, sublabel, value, color = 'primary' }: CreneauStatCardProps) {
  return (
    <CarteStat libelle={label} valeur={`${value}%`} note={sublabel} ton={TON[color]}>
      <Progress size="md" value={value} color={color} aria-label={label} radius="none" className="mt-3" />
    </CarteStat>
  );
}
