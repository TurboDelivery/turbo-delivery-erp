'use client';

import CarteStat, { GrilleStats, type TonStat } from '@/components/commons/CarteStat';
import { formatMontant } from '@/utils/format.utils';

import { IPaiementStats } from '../types/paiement.type';

interface PaiementStatsCardsProps {
  stats: IPaiementStats;
  isLoading?: boolean;
}

/**
 * Bandeau des paiements : total, reste a decaisser, deja decaisse.
 *
 * <p>Portait sa propre carte, son propre squelette de chargement et sa propre grille.</p>
 *
 * <p>Il composait aussi ses montants a la main
 * (`toLocaleString('fr-FR') + ' FCFA'`), l'une des ecritures qui contournent
 * `formatMontant` : un montant nul s'y affichait « 0 FCFA » mais sans l'espace insecable,
 * et rien ne garantissait la coherence avec le reste de l'ERP.</p>
 *
 * <p>Les couleurs etaient des classes brutes (`text-orange-500`, `text-yellow-500`).
 * Elles deviennent des tons, et ces tons disent quelque chose : ce qui reste a decaisser
 * appelle une action, ce qui est decaisse est acquis.</p>
 */
export default function PaiementStatsCards({ stats, isLoading }: PaiementStatsCardsProps) {
  const cartes: { libelle: string; valeur: number; ton: TonStat }[] = [
    { libelle: 'Total global', valeur: stats?.totalGlobal ?? 0, ton: 'neutre' },
    { libelle: 'À décaisser', valeur: stats?.aDecaisser ?? 0, ton: 'attention' },
    { libelle: 'Décaissé', valeur: stats?.decaisse ?? 0, ton: 'succes' },
  ];

  return (
    <GrilleStats colonnes={3}>
      {cartes.map((c) => (
        <CarteStat
          key={c.libelle}
          libelle={c.libelle}
          valeur={formatMontant(c.valeur)}
          ton={c.ton}
          isLoading={isLoading}
        />
      ))}
    </GrilleStats>
  );
}
