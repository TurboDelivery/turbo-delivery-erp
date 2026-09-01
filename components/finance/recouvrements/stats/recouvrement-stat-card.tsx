'use client';

import Link from 'next/link';
import { ReactNode, isValidElement } from 'react';

import CarteStat, { type TonStat } from '@/components/commons/CarteStat';
import { formatMontant } from '@/utils/format.utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  colorVariant?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'indigo';
  href?: string;
  formatValue?: (value: string | number) => string;
  className?: string;
}

/** Six variantes ramenees sur les cinq tons ; violet et indigo n'ont pas de sens propre ici. */
const TON: Record<NonNullable<StatCardProps['colorVariant']>, TonStat> = {
  blue: 'primaire',
  green: 'succes',
  amber: 'attention',
  red: 'danger',
  purple: 'neutre',
  indigo: 'neutre',
};

/**
 * Carte de statistique du recouvrement.
 *
 * <p>Enveloppe `CarteStat` en conservant sa signature. Elle portait une bande coloree a
 * gauche et six variantes de couleur ecrites en classes de palette, dont deux (violet,
 * indigo) qui ne disaient rien de particulier.</p>
 *
 * <p>Defaut corrige : quand un `href` etait fourni, le `<Link>` etait a l'INTERIEUR de la
 * carte. Seul le contenu etait donc cliquable, pas la carte, et la zone reellement
 * activable ne correspondait pas a ce que l'oeil percoit. Le lien enveloppe desormais la
 * carte entiere.</p>
 */
export function StatCard({
  title,
  value,
  icon,
  colorVariant = 'blue',
  href,
  formatValue,
  className = '',
}: StatCardProps) {
  const carte = (
    <CarteStat
      libelle={title}
      valeur={formatValue ? formatValue(value) : value}
      icone={isValidElement(icon) ? icon : undefined}
      ton={TON[colorVariant]}
      className={className}
    />
  );

  return href ? (
    <Link href={href} className="block rounded-large focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40">
      {carte}
    </Link>
  ) : (
    carte
  );
}

/** Formatage monetaire unique de l'ERP. Conserve : des appelants l'importent encore. */
export const formatCurrency = (value: string | number): string =>
  formatMontant(typeof value === 'string' ? parseFloat(value) : value);

export const formatNumber = (value: string | number): string =>
  (typeof value === 'string' ? parseFloat(value) : value).toLocaleString('fr-FR');

export const formatPercentage = (value: string | number): string =>
  `${(typeof value === 'string' ? parseFloat(value) : value).toFixed(1)}%`;
