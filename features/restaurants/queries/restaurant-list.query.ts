'use client';

import { useQuery } from '@tanstack/react-query';
import { getRestaurantsPaginated, getRestaurantById } from '@/features/restaurants/actions/restaurant.actions';
import { IRestaurantParams } from '@/features/restaurants/types/restaurant.type';

export const restaurantKeys = {
  all: ['restaurants'] as const,
  lists: () => [...restaurantKeys.all, 'list'] as const,
  list: (params: IRestaurantParams) => [...restaurantKeys.lists(), params] as const,
  details: () => [...restaurantKeys.all, 'detail'] as const,
  detail: (id: string) => [...restaurantKeys.details(), id] as const,
};

export const useRestaurantsListQuery = (params: IRestaurantParams) => {
  return useQuery({
    queryKey: restaurantKeys.list(params),
    queryFn: () => getRestaurantsPaginated(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRestaurantQuery = (id: string) => {
  return useQuery({
    queryKey: restaurantKeys.detail(id),
    queryFn: () => getRestaurantById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

