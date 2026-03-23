'use client';

import { useMemo } from 'react';
import { useFacturesParRestaurantQuery } from '@/features/recouvrements/queries/facture.query';

interface UseRestaurantFacturesOptions {
  restaurantId?: string;
}

export function useRestaurantFactures({ restaurantId }: UseRestaurantFacturesOptions) {
  const { data, isLoading, isFetching, isError, error } = useFacturesParRestaurantQuery(restaurantId, {
    page: 0,
    size: 100,
  });

  const factureOptions = useMemo(
    () =>
      (data?.content ?? []).map((facture) => ({
        value: facture.id,
        label: `${facture.code} - ${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(facture.restant ?? 0)} FCFA`,
      })),
    [data?.content],
  );

  return {
    factures: data?.content ?? [],
    factureOptions,
    isLoading: isLoading || isFetching,
    isError,
    error,
  };
}
