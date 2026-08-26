import React from 'react';

import CarteStat, { type TonStat } from '@/components/commons/CarteStat';

type CardProps = {
  title?: string;
  value?: string | number;
  /** Ancienne couleur du chiffre : classe Tailwind ou hexadecimal. Traduite en ton. */
  color: string;
  /** Ancien fond de la pastille : classe Tailwind. Traduit en ton. */
  bgColor: string;
  icon: React.ReactNode;
  isLoading?: boolean;
};

/**
 * Carte de statistique des depenses.
 *
 * <p>Enveloppe `CarteStat`, la carte unique de l'ERP, en conservant sa signature pour ne
 * pas toucher ses points d'appel.</p>
 *
 * <p>Ce fichier et
 * `features/revenus/components/cumul/investissement/stats/investissement-stat-card.tsx`
 * etaient un COPIER-COLLER l'un de l'autre, template literal sans interpolation compris.
 * Ils ne differaient que par `gap-2` contre `gap-8`, `first-letter:uppercase` contre
 * `capitalize`, et une police. Les deux passent desormais par le meme composant.</p>
 *
 * <p>Les couleurs arrivaient en classes Tailwind et en hexadecimal (`#10B981`,
 * `bg-blue-50`), ce qui interdisait toute garantie en mode sombre. Elles sont traduites
 * en tons ; une valeur inconnue retombe sur `neutre` plutot que de disparaitre.</p>
 */
const TON: Record<string, TonStat> = {
  'bg-blue-50': 'primaire',
  'bg-blue-100': 'primaire',
  'bg-green-50': 'succes',
  'bg-green-100': 'succes',
  'bg-red-50': 'danger',
  'bg-yellow-50': 'attention',
  'bg-yellow-100': 'attention',
};

function StatisticDepenseCard({ title, value, color, bgColor, icon, isLoading = false }: CardProps) {
  return (
    <CarteStat
      libelle={title ?? ''}
      valeur={value ?? ''}
      icone={React.isValidElement(icon) ? icon : undefined}
      ton={TON[bgColor] ?? 'neutre'}
      isLoading={isLoading}
    />
  );
}

export default StatisticDepenseCard;
