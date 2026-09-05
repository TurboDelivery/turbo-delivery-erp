'use client';

import { ProgressBar } from '@heroui-v3/react';

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
      {/*
       * La barre etait passee en v3 par une reecriture automatique qui lui avait laisse un
       * attribut `aria-` vide et un `<Label>` REDONDANT — le libelle est deja rendu par la
       * carte, le lecteur d'ecran l'entendait deux fois.
       */}
      <ProgressBar aria-label={label} className="mt-3" value={value}>
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </CarteStat>
  );
}
