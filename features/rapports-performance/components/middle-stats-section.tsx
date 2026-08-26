'use client';

import { Clock, TrendingUp, Box } from 'lucide-react';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { ISecondaryKPIs } from '@/features/rapports-performance/types/performance.type';

interface MiddleStatsSectionProps {
  secondaryKPIs?: ISecondaryKPIs;
}

export function MiddleStatsSection({ secondaryKPIs }: MiddleStatsSectionProps) {
  return (
    <GrilleStats colonnes={3}>
      <CarteStat
        libelle="Temps Moyen de Livraison"
        valeur={secondaryKPIs?.averageDeliveryTime ? `${secondaryKPIs.averageDeliveryTime} min` : '0 min'}
        note="De la récupération à la remise"
        icone={Clock}
      />

      <CarteStat
        libelle="Croissance Mensuelle"
        valeur={secondaryKPIs?.monthlyGrowth ? `${secondaryKPIs.monthlyGrowth.toFixed(1)}%` : '0%'}
        note="Par rapport au mois précédent"
        icone={TrendingUp}
        ton="succes"
      />

      <CarteStat
        libelle="Articles par Commande"
        valeur={secondaryKPIs?.averageItemsPerOrder ?? 0}
        note="Moyenne par livraison"
        icone={Box}
      />
    </GrilleStats>
  );
}
