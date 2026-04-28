'use client';

import { useMemo } from 'react';
import { useRestaurantStatsQuery } from '@/features/restaurants/queries/restaurant-list.query';
import { useRestaurantFilters } from '@/features/restaurants/hooks/use-restaurant-filters';

export interface IRestaurantStats {
  totalPartenaires: number;
  commissionPourcentage: number;
  commissionFixe: number;
  parCycleQuotidien: number;
  parCycleHebdomadaire: number;
  parCycleBiHebdomadaire: number;
  parCycleMensuel: number;
}

export const useRestaurantStats = () => {
  const { filters } = useRestaurantFilters();

  const statsParams = useMemo(() => ({
    search: filters.search || undefined,
    localisation: filters.localisation || undefined,
    email: filters.email || undefined,
    telephone: filters.telephone || undefined,
    commune: filters.commune || undefined,
    methodRecouvrement: filters.methodRecouvrement || undefined,
  }), [
    filters.search,
    filters.localisation,
    filters.email,
    filters.telephone,
    filters.commune,
    filters.methodRecouvrement,
  ]);

  const { data, isLoading, isError } = useRestaurantStatsQuery(statsParams);

  const stats: IRestaurantStats = useMemo(() => ({
    totalPartenaires: data?.totalPartenaires ?? 0,
    commissionPourcentage: data?.commissions.pourcentage ?? 0,
    commissionFixe: data?.commissions.fixe ?? 0,
    parCycleQuotidien: data?.cyclesPaiement.quotidien ?? 0,
    parCycleHebdomadaire: data?.cyclesPaiement.hebdomadaire ?? 0,
    parCycleBiHebdomadaire: data?.cyclesPaiement.biHebdomadaire ?? 0,
    parCycleMensuel: data?.cyclesPaiement.mensuel ?? 0,
  }), [data]);

  return { stats, isLoading, isError };
};
