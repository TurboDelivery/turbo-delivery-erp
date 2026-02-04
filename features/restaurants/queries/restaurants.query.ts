'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClientHttp } from '@/lib/api-client-http';
import { RestaurantDefini } from '@/types/price-list';

const restaurantEndpoints = {
  defined: {
    endpoint: '/api/erp/frais-livraison/restaurant/defini',
    method: 'GET',
  },
};

export const restaurantKeys = {
  all: ['restaurants'] as const,
  defined: () => [...restaurantKeys.all, 'defined'] as const,
};

export const useDefinedRestaurantsQuery = () => {
  return useQuery({
    queryKey: restaurantKeys.defined(),
    queryFn: async () =>
      apiClientHttp.request<RestaurantDefini[]>({
        endpoint: restaurantEndpoints.defined.endpoint,
        method: restaurantEndpoints.defined.method,
        service: 'backend',
      }),
    staleTime: 5 * 60 * 1000,
  });
};
