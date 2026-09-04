import React from 'react';

import CarteStat, { type TonStat } from '@/components/commons/CarteStat';

/**
 * Carte de statistique de la validation finance.
 *
 * <p>Enveloppe `CarteStat` en conservant sa signature, pour ne pas toucher ses points
 * d'appel. Elle portait un `hover:shadow-md` qui la faisait paraitre cliquable alors
 * qu'aucun gestionnaire n'etait branche : c'est retire.</p>
 *
 * <p>`iconBg` recevait des classes Tailwind brutes (`bg-blue-50`, `bg-foreground`), ce qui
 * empechait toute garantie en mode sombre. Elles sont traduites en tons.</p>
 */
const TON_PAR_FOND: Record<string, TonStat> = {
  'bg-blue-50': 'primaire',
  'bg-green-50': 'succes',
  'bg-orange-50': 'attention',
  'bg-yellow-50': 'attention',
  'bg-foreground': 'neutre',
};

export function StatCard({ icon, iconBg, label, value }: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number | string;
  /** Ne sert plus : la taille du chiffre s'adapte desormais d'elle-meme. */
  isText?: boolean;
}) {
  return (
    <CarteStat
      libelle={label}
      valeur={value}
      icone={React.isValidElement(icon) ? icon : undefined}
      ton={TON_PAR_FOND[iconBg] ?? 'neutre'}
    />
  );
}
