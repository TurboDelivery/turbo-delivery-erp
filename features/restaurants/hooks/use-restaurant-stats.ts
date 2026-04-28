'use client';

import { useMemo, useState, useEffect } from 'react';
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

const DEBOUNCE_MS = 350;

export const useRestaurantStats = () => {
  const { filters } = useRestaurantFilters();

  const [debouncedFilters, setDebouncedFilters] = useState({
    search: filters.search,
    localisation: filters.localisation,
    email: filters.email,
    telephone: filters.telephone,
    commune: filters.commune,
    methodRecouvrement: filters.methodRecouvrement,
  });

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedFilters({
        search: filters.search,
        localisation: filters.localisation,
        email: filters.email,
        telephone: filters.telephone,
        commune: filters.commune,
        methodRecouvrement: filters.methodRecouvrement,
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [filters.search, filters.localisation, filters.email, filters.telephone, filters.commune, filters.methodRecouvrement]);

  const statsParams = useMemo(() => ({
    search: debouncedFilters.search || undefined,
    localisation: debouncedFilters.localisation || undefined,
    email: debouncedFilters.email || undefined,
    telephone: debouncedFilters.telephone || undefined,
    commune: debouncedFilters.commune || undefined,
    methodRecouvrement: debouncedFilters.methodRecouvrement || undefined,
  }), [
    debouncedFilters.search,
    debouncedFilters.localisation,
    debouncedFilters.email,
    debouncedFilters.telephone,
    debouncedFilters.commune,
    debouncedFilters.methodRecouvrement,
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
