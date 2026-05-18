'use client';

import { useMemo } from 'react';
import { useFacturesRFQuery } from '../queries/responsable-financier.query';
import { IFactureRFParams } from '../types/responsable-financier.types';

export interface FactureRFStatCard {
  title: string;
  value: number;
  isCurrency: boolean;
}

export const useResponsableFinancierStats = (params?: IFactureRFParams) => {
  const { data, isLoading, isError } = useFacturesRFQuery(params);

  const statsCards = useMemo((): FactureRFStatCard[] => {
    if (!data?.stats) {
      return [
        { title: 'Total factures', value: 0, isCurrency: false },
        { title: 'Montant total', value: 0, isCurrency: true },
        { title: 'Nombre de partenaires', value: 0, isCurrency: false },
        { title: 'Taux de recouvrement', value: 0, isCurrency: false },
      ];
    }

    const { totalFactures, totalMontant, nombrePartenaires, tauxRecouvrement } = data.stats;

    return [
      { title: 'Total factures', value: totalFactures, isCurrency: false },
      { title: 'Montant total', value: totalMontant, isCurrency: true },
      { title: 'Nombre de partenaires', value: nombrePartenaires, isCurrency: false },
      { title: 'Taux de recouvrement', value: tauxRecouvrement, isCurrency: false },
    ];
  }, [data]);

  return { statsCards, isLoading, isError };
};
