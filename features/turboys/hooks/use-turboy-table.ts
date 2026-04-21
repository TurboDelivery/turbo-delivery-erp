'use client';

import { useMemo } from 'react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { turboyTableColumns } from '@/components/turboys/table/turboy-table-columns';
import { useTurboysByTypeQuery } from '@/features/turboys/queries/turboy-list.query';
import { useTurboyFilters } from '@/features/turboys/hooks/use-turboy-filters';

export const useTurboyTable = () => {
  const { filters, setFilters } = useTurboyFilters();

  const currentSearchParams = useMemo(() => {
    return {
      page: filters.page ?? 0,
      limit: filters.limit ?? 10,
      search: filters.search || undefined,
      orderBy: filters.orderBy || undefined,
      orderDirection: filters.orderDirection as 'asc' | 'desc' | undefined,
      typeLivreur: filters.typeLivreur as any,
    };
  }, [filters.page, filters.limit, filters.search, filters.orderBy, filters.orderDirection, filters.typeLivreur]);

  const { data: turboysData, isLoading, error, isError, isFetching } = useTurboysByTypeQuery(currentSearchParams);
  const turboys = turboysData?.livreurs?.content || [];

  const table = useReactTable({
    columns: turboyTableColumns,
    data: turboys,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const setSearch = (search: string) => {
    setFilters((prev) => ({
      ...prev,
      search,
      page: 0,
    }));
  };

  return {
    table,
    isLoading,
    isError,
    isFetching,
    setFilters,
    turboys,
    turboysData,
    error,
    filters,
    setSearch,
  };
};
