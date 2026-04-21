'use client';

import { useQueryStates } from 'nuqs';
import { TAB_VALUES, turboyFiltersClient, VIEW_MODE_VALUES } from '@/features/turboys/filters/turboy.filters';
import { TurboyType } from '@/features/turboys/types/turboys.types';

export type ActiveTab = (typeof TAB_VALUES)[number];
export type ViewMode = (typeof VIEW_MODE_VALUES)[number];

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
      tab: 'all',
      viewMode: 'list',
    });
  };

  const setSearch = (search: string) => {
    setFilters((prev) => ({
      ...prev,
      search,
      page: 0,
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
      page: 0,
    }));
  };

  const setSorting = (orderBy: string, orderDirection: 'asc' | 'desc') => {
    setFilters((prev) => ({
      ...prev,
      orderBy,
      orderDirection,
    }));
  };

  const setTypeLivreur = (typeLivreur: TurboyType | null) => {
    setFilters((prev) => ({
      ...prev,
      typeLivreur,
      page: 0,
    }));
  };

  const setTab = (tab: ActiveTab) => {
    setFilters((prev) => ({
      ...prev,
      tab,
    }));
  };

  const setViewMode = (viewMode: ViewMode) => {
    setFilters((prev) => ({
      ...prev,
      viewMode,
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
    setTab,
    setViewMode,
  };
};

