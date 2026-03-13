'use client';

import { useQueryStates } from 'nuqs';
import { turboyFiltersClient } from '@/features/turboys/filters/turboy.filters';
import { TurboyType } from '@/features/turboys/types/turboys.types';

export const useTurboyFilters = () => {
  const [filters, setFilters] = useQueryStates(turboyFiltersClient.filters, turboyFiltersClient.options);

  const resetFilters = () => {
    setFilters({
      search: '',
      page: 0,
      limit: 10,
      orderBy: 'nom',
      orderDirection: 'asc',
      typeLivreur: undefined,
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

  const setTypeLivreur = (typeLivreur: TurboyType) => {
    setFilters((prev) => ({
      ...prev,
      typeLivreur,
      page: 0, // Reset to first page when changing type
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
    setTypeLivreur,
  };
};

