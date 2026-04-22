'use client';

import { useQueryStates } from 'nuqs';
import { restaurantFiltersClient } from '@/features/restaurants/filters/restaurant.filters';

export const useRestaurantFilters = () => {
  const [filters, setFilters] = useQueryStates(restaurantFiltersClient.filters, restaurantFiltersClient.options);

  const resetFilters = () => {
    setFilters({
      search: '',
      page: 0,
      limit: 10,
      orderBy: 'nomEtablissement',
      orderDirection: 'asc',
      localisation: '',
      email: '',
      telephone: '',
      commune: '',
      methodRecouvrement: '',
    });
  };

  const setSearch = (search: string) => {
    setFilters((prev) => ({
      ...prev,
      search,
      page: 0, // Reset to first page when searching
    }));
  };

  const setPage = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const setLimit = (limit: number) => {
    setFilters((prev) => ({
      ...prev,
      limit,
      page: 0, // Reset to first page when changing limit
    }));
  };

  const setSorting = (orderBy: string, orderDirection: 'asc' | 'desc') => {
    setFilters((prev) => ({
      ...prev,
      orderBy,
      orderDirection,
    }));
  };

  return {
    filters,
    setFilters,
    resetFilters,
    setSearch,
    setPage,
    setLimit,
    setSorting,
  };
};

