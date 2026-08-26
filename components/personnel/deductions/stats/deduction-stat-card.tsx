import React from 'react';

import CarteStat from '@/components/commons/CarteStat';
import { formatMontant } from '@/utils/format.utils';

type Props = {
  label: string;
  value: number;
  description: string;
  color?: 'red' | 'green' | 'orange' | 'default';
};

const TON = {
  red: 'danger',
  green: 'succes',
  orange: 'attention',
  default: 'neutre',
} as const;

/**
 * Carte de statistique des deductions.
 *
 * <p>Enveloppe desormais `CarteStat`, la carte unique de l'ERP, en conservant sa
 * signature : les 10 points d'appel n'ont pas a changer. Elle avait sa propre mise en
 * page, sa propre taille de chiffre et sa propre facon d'exprimer une couleur.</p>
 *
 * <p>Elle utilisait `formatCFA`, qui rend « 0 » NU sur une valeur nulle, donc une
 * deduction a zero perdait sa devise. Elle passe par `formatMontant`.</p>
 */
function DeductionStatCard({ label, value, description, color = 'default' }: Props) {
  return (
    <CarteStat libelle={label} valeur={formatMontant(value)} note={description} ton={TON[color]} />
  );
}

export default DeductionStatCard;
