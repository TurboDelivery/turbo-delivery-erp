'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPriceListByRestaurant } from '@/src/price-list/price-list.action';

export const priceListKeys = {
  all: ['price-list'] as const,
  byRestaurant: (restaurantId: string, page: number, size: number) =>
    [...priceListKeys.all, restaurantId, page, size] as const,
};

export const useDeliveryFeesByRestaurantQuery = (restaurantId: string | null, page: number, size = 10) => {
  return useQuery({
    queryKey: priceListKeys.byRestaurant(restaurantId ?? '', page, size),
    queryFn: () => getPriceListByRestaurant(restaurantId!, page, size),
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useInvalidatePriceListQuery = () => {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: priceListKeys.all });
  };
};
