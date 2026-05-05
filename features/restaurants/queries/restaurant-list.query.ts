'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRestaurantsPaginated, getRestaurantById, getRestaurantStats, deleteRestaurant, deleteRestaurantForce, toggleRestaurantStatus } from '@/features/restaurants/actions/restaurant.actions';
import { IRestaurantParams, IRestaurantStatsParams } from '@/features/restaurants/types/restaurant.type';

export const restaurantKeys = {
  all: ['restaurants'] as const,
  lists: () => [...restaurantKeys.all, 'list'] as const,
  list: (params: IRestaurantParams) => [...restaurantKeys.lists(), params] as const,
  details: () => [...restaurantKeys.all, 'detail'] as const,
  detail: (id: string) => [...restaurantKeys.details(), id] as const,
  stats: (params: IRestaurantStatsParams) => [...restaurantKeys.all, 'stats', params] as const,
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

export const useRestaurantStatsQuery = (params: IRestaurantStatsParams, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: restaurantKeys.stats(params),
    queryFn: () => getRestaurantStats(params),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
};

export const useInvalidateRestaurantsQuery = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: restaurantKeys.all });
};

export const useDeleteRestaurantMutation = () => {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: restaurantKeys.all });

  const softDelete = useMutation({
    mutationFn: (id: string) => deleteRestaurant(id),
    onSuccess: invalidate,
  });

  const hardDelete = useMutation({
    mutationFn: (id: string) => deleteRestaurantForce(id),
    onSuccess: invalidate,
  });

  return { softDelete, hardDelete };
};

export const useToggleRestaurantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, activate }: { id: string; activate: boolean }) =>
      toggleRestaurantStatus(id, activate),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: restaurantKeys.all }),
  });
};

