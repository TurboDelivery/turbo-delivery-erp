'use client';

import { useMemo } from 'react';
import { useRestaurantsListQuery } from '@/features/restaurants/queries/restaurant-list.query';
import { useRestaurantFilters } from '@/features/restaurants/hooks/use-restaurant-filters';

export const useRestaurantList = () => {
  const { filters, setPage, setSearch, setLimit, setSorting, resetFilters } = useRestaurantFilters();

  
  const queryParams = useMemo(() => {
    return {
      page: filters.page,
      limit: filters.limit,
      search: filters.search || undefined,
      orderBy: filters.orderBy || undefined,
      orderDirection: filters.orderDirection as 'asc' | 'desc' | undefined,
    };
  }, [filters.page, filters.limit, filters.search, filters.orderBy, filters.orderDirection]);

  const { data, isLoading, error, isError, isFetching } = useRestaurantsListQuery(queryParams);

  const restaurants = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const pagination = {
    pageCount: totalPages,
    totalItems: totalElements,
    page: filters.page,
    handlePageChange: (page: number) => {
      setPage(page - 1);
    },
  };

  return {
    restaurants,
    isLoading,
    error,
    isError,
    isFetching,
    pagination,
    filters,
    setSearch,
    setLimit,
    setSorting,
    resetFilters,
  };
};

