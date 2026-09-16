'use client';

import { useMemo } from 'react';
import { nomComplet } from '@/utils/nom.utils';
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
      // Meme composeur que partout ailleurs : le serveur met le nom avant les prenoms, et
      // c'est ce que la ligne affiche. Trie, parce qu'on cherche en tapant.
      .map((l) => ({ value: l.id, label: nomComplet(l) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }, [livreurs]);

  const restaurantOptions: SelectOption[] = useMemo(() => toRestaurantOptions(restaurants), [restaurants]);

  return {
    livreurOptions,
    restaurantOptions,
    isLoadingOptions: isLoadingLivreurs || isLoadingRestaurants,
  };
}
