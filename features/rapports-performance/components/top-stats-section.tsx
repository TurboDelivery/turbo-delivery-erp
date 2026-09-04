'use client';

import { Package, DollarSign, CheckCircle } from 'lucide-react';
import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { IMainKPIs } from '@/features/rapports-performance/types/performance.type';
import { formatMontant } from '@/utils/format.utils';
import { formatNumber } from '@/utils/formatNumber';

interface TopStatsSectionProps {
  mainKPIs?: IMainKPIs;
}

export function TopStatsSection({ mainKPIs }: TopStatsSectionProps) {
  return (
    <GrilleStats colonnes={4}>
      {/* « Moyenne: 12.1 livraisons/jour » et « +12% vs mois precedent » sont ECRITS EN
          DUR depuis la maquette : aucun KPI ne les porte. Ils sont conserves tels quels,
          la migration ne touche pas aux valeurs affichees. */}
      <CarteStat
        libelle="Nombre de Livraisons"
        valeur={formatNumber(mainKPIs?.totalDeliveries ?? 0)}
        note="Moyenne: 12.1 livraisons/jour"
        icone={Package}
        ton="danger"
      >
        <p className="mt-1 text-[11px] font-medium leading-tight text-success-soft-foreground">
          +12% vs mois précédent
        </p>
      </CarteStat>

      <CarteStat
        libelle="Valeur Totale des Commandes"
        valeur={mainKPIs?.totalOrderValue ? `${(mainKPIs.totalOrderValue / 1000000).toFixed(2)}M` : '0'}
        note={formatMontant(mainKPIs?.totalOrderValue ?? 0)}
        icone={DollarSign}
        ton="attention"
      />

      <CarteStat
        libelle="Chiffre d'Affaires"
        valeur={mainKPIs?.chiffreAffaires ? `${(mainKPIs.chiffreAffaires / 1000000).toFixed(2)}M` : '0'}
        note={formatMontant(mainKPIs?.chiffreAffaires ?? 0)}
        icone={DollarSign}
        ton="primaire"
      />

      <CarteStat
        libelle="Taux de Succès"
        valeur={mainKPIs?.successRate ? `${mainKPIs.successRate.toFixed(1)}%` : '0%'}
        note="Livraisons sans litige"
        icone={CheckCircle}
        ton="succes"
      />
    </GrilleStats>
  );
}
