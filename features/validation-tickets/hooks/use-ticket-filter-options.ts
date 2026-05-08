'use client';

import { useMemo } from 'react';
import { useLivreursListQuery } from '@/features/tickets/queries/livreur-list.query';
import { useDefinedRestaurantsQuery } from '@/features/restaurants/queries/restaurants.query';
import { toRestaurantOptions } from '@/features/restaurants';
import { SelectOption } from '@/components/validation-tickets/TicketFilterBar';

export function useTicketFilterOptions() {
  const { data: livreurs, isLoading: isLoadingLivreurs } = useLivreursListQuery();
  const { data: restaurants = [], isLoading: isLoadingRestaurants } = useDefinedRestaurantsQuery();

  const livreurOptions: SelectOption[] = useMemo(() => {
    if (!livreurs) return [];
    return livreurs
      .filter((l) => l.id && (l.nom || l.prenoms))
      .map((l) => ({ value: l.id, label: `${l.prenoms ?? ''} ${l.nom ?? ''}`.trim() }));
  }, [livreurs]);

  const restaurantOptions: SelectOption[] = useMemo(() => toRestaurantOptions(restaurants), [restaurants]);

  return {
    livreurOptions,
    restaurantOptions,
    isLoadingOptions: isLoadingLivreurs || isLoadingRestaurants,
  };
}
