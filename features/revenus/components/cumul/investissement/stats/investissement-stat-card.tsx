import React from 'react';

import CarteStat, { type TonStat } from '@/components/commons/CarteStat';
import { formatMontant } from '@/utils/format.utils';

type Props = {
  stat: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
  };
  isLoading?: boolean;
};

/**
 * Carte de statistique des investissements.
 *
 * <p>Enveloppe `CarteStat`, la carte unique de l'ERP, en conservant sa signature a objet
 * `stat` pour ne pas toucher ses points d'appel.</p>
 *
 * <p>Son balisage etait un COPIER-COLLER de `components/depenses/stats/statistic-depense-card.tsx`,
 * template literal sans interpolation compris. Les deux ne differaient que par `gap-8`
 * contre `gap-2`, `capitalize` contre `first-letter:uppercase`, et une police. Elles
 * partagent desormais le meme composant. Leurs SIGNATURES, elles, divergeaient : celle-ci
 * recoit un objet, l'autre des props a plat.</p>
 *
 * <p>Elle utilisait `formatCFA`, qui rend « 0 » NU sur une valeur nulle : un
 * investissement a zero perdait sa devise. Elle passe par `formatMontant`.</p>
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

function InvestissementStatCard({ stat, isLoading = false }: Props) {
  return (
    <CarteStat
      libelle={stat.title}
      valeur={typeof stat.value === 'number' ? formatMontant(stat.value) : stat.value}
      icone={React.isValidElement(stat.icon) ? stat.icon : undefined}
      ton={TON[stat.bgColor] ?? 'neutre'}
      isLoading={isLoading}
    />
  );
}

export default InvestissementStatCard;
