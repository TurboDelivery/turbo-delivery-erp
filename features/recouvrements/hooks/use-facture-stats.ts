'use client';

import { useMemo } from 'react';
import { useFactureSummaryQuery } from '../queries/facture.query';

export interface FactureStatsCardData {
  title: string;
  value: number;
  isCurrency: boolean;
}

export const useFactureStats = (debut?: Date, fin?: Date) => {
  // isFetching et refetch remontent pour que le bandeau puisse proposer "Reessayer" sur echec
  const { data, isLoading, isError, isFetching, error, refetch } = useFactureSummaryQuery(debut, fin);

  const statsCards = useMemo((): FactureStatsCardData[] => {
    if (!data) {
      return [
        { title: 'Factures à recouvrir', value: 0, isCurrency: false },
        { title: 'Montant total à recouvrir', value: 0, isCurrency: true },
        { title: 'Montant déjà recouvré', value: 0, isCurrency: true },
        { title: 'Reste à recouvrir', value: 0, isCurrency: true },
      ];
    }

    const montantRestant = data.montantTotalARecouvrir - data.montantDejaRecouvre;

    return [
      {
        title: 'Factures à recouvrir',
        value: data.nombreFacturesARecouvrir,
        isCurrency: false,
      },
      {
        title: 'Montant total à recouvrir',
        value: data.montantTotalARecouvrir,
        isCurrency: true,
      },
      {
        title: 'Montant déjà recouvré',
        value: data.montantDejaRecouvre,
        isCurrency: true,
      },
      {
        title: 'Reste à recouvrir',
        value: montantRestant,
        isCurrency: true,
      },
    ];
  }, [data]);

  return {
    statsCards,
    isLoading,
    isError,
    isFetching,
    error,
    refetch,
    summary: data,
  };
};
