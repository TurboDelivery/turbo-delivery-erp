'use client';

import { useMemo } from 'react';
import { useLivreursListQuery } from '@/features/tickets/queries/livreur-list.query';
import { useRestaurantsListQuery } from '@/features/restaurants/queries/restaurant-list.query';
import { SelectOption } from '@/components/validation-tickets/TicketFilterBar';

export function useTicketFilterOptions() {
  const { data: livreurs, isLoading: isLoadingLivreurs } = useLivreursListQuery();
  const { data: restaurantsData, isLoading: isLoadingRestaurants } = useRestaurantsListQuery({ limit: 200 });

  const livreurOptions: SelectOption[] = useMemo(() => {
    if (!livreurs) return [];
    return livreurs
      .filter((l) => l.id && (l.nom || l.prenoms))
      .map((l) => ({ value: l.id, label: `${l.prenoms ?? ''} ${l.nom ?? ''}`.trim() }));
  }, [livreurs]);

  const restaurantOptions: SelectOption[] = useMemo(() => {
    const list = restaurantsData?.content ?? [];
    return list.map((r) => ({
      value: r.id,
      label: r.nomEtablissement,
    }));
  }, [restaurantsData]);

  return {
    livreurOptions,
    restaurantOptions,
    isLoadingOptions: isLoadingLivreurs || isLoadingRestaurants,
  };
}
